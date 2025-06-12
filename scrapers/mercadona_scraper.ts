import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

interface MercadonaProduct {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    productCategory?: string;
}

interface ProductCategory {
    name: string;
    description: string;
}

class MercadonaScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private products: MercadonaProduct[] = [];
    private readonly baseUrl = 'https://tienda.mercadona.es/';
    private readonly DEEPSEEK_API_KEY: string = process.env.DEEPSEEK_API_KEY || '';

    public getPage(): Page | null {
        return this.page;
    }

    async initialize() {
        console.log('Iniciando el navegador...');
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
            });
            console.log('Navegador iniciado correctamente');

            this.page = await this.browser.newPage();
            console.log('Nueva página creada');
            
            // Configurar viewport para mejor visualización
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Configurar user agent para evitar bloqueos
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            console.log('Navegando a la página principal...');
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            console.log('Página principal cargada');
            
            // Esperar y manejar el modal del código postal
            try {
                console.log('Buscando modal de código postal...');
                await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
                console.log('Modal encontrado, introduciendo código postal...');
                await this.page.type('input[type="text"]', '28011');
                
                // Buscar y hacer clic en el botón CONTINUAR
                console.log('Buscando botón CONTINUAR...');
                const buttons = await this.page.$$('button');
                let buttonFound = false;
                for (const button of buttons) {
                    const text = await this.page.evaluate(el => el.textContent, button);
                    if (text && text.trim().toUpperCase().includes('CONTINUAR')) {
                        console.log('Botón CONTINUAR encontrado, haciendo clic...');
                        await button.click();
                        buttonFound = true;
                        break;
                    }
                }
                
                if (!buttonFound) {
                    console.log('No se encontró el botón CONTINUAR');
                }
                
                // Esperar a que desaparezca el modal y la página se cargue completamente
                console.log('Esperando a que desaparezca el modal y la página se cargue...');
                await Promise.all([
                    this.page.waitForSelector('input[type="text"]', { hidden: true, timeout: 10000 }),
                    this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
                ]);
                console.log('Modal cerrado y página cargada correctamente');

                // Esperar un poco más para asegurar que todo está cargado
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.log('No se encontró el modal del código postal o ya estaba cerrado:', error);
            }
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            throw error;
        }
    }

    async getCategoryLinks(): Promise<string[]> {
        if (!this.page) throw new Error('Browser not initialized');
        
        console.log('Buscando y haciendo clic en el enlace de Categorías...');
        await this.page.waitForSelector('a[href="/categories"]', { timeout: 30000 });
        await this.page.click('a[href="/categories"]');
        
        // Esperar a que el menú lateral de categorías esté visible
        await this.page.waitForSelector('nav[aria-label="Categorías"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera extra por animación

        // Extraer los enlaces de todas las subcategorías del menú lateral
        const categories = await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('nav[aria-label="Categorías"] a[href*="/categories/"]')) as HTMLAnchorElement[];
            // Filtrar solo los enlaces que llevan a una subcategoría (evitar duplicados y enlaces vacíos)
            return links.map(link => link.href).filter(href => href.includes('/categories/'));
        });

        console.log(`Se encontraron ${categories.length} enlaces de subcategorías`);
        return [...new Set(categories)];
    }

    async scrapeProducts(categoryUrl: string): Promise<MercadonaProduct[]> {
        if (!this.page) throw new Error('Browser not initialized');

        try {
            console.log(`Navegando a categoría: ${categoryUrl}`);
            await this.page.goto(categoryUrl, { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            
            // Verificar si estamos en una página de error
            const currentUrl = this.page.url();
            if (currentUrl.includes('/not-found') || currentUrl.includes('/error')) {
                console.log(`Página de error detectada: ${currentUrl}`);
                return [];
            }

            console.log('Esperando a que los productos se carguen...');
            try {
                await this.page.waitForSelector('div[data-testid="product-cell"]', { 
                    timeout: 10000 
                });
            } catch (error) {
                console.log('No se encontraron productos en esta categoría');
                return [];
            }

            console.log('Iniciando scroll automático...');
            await this.autoScroll();
            console.log('Scroll completado');

            console.log('Extrayendo datos de productos...');
            const products = await this.page.evaluate(() => {
                const productElements = document.querySelectorAll('div[data-testid="product-cell"]');
                return Array.from(productElements).map(product => {
                    const nameElement = product.querySelector('h4[data-testid="product-cell-name"]');
                    const priceElement = product.querySelector('p[data-testid="product-price"]');
                    const imageElement = product.querySelector('img');
                    return {
                        name: nameElement?.textContent?.trim() || '',
                        price: priceElement?.textContent?.trim() || '',
                        image: imageElement?.getAttribute('src') || '',
                        category: window.location.href,
                        description: '',
                        productCategory: ''
                    };
                });
            });

            console.log(`Se encontraron ${products.length} productos en la categoría`);

            // Categorizar toda la categoría de una vez
            if (products.length > 0) {
                try {
                    const categoryName = await this.categorizeCategory(products);
                    console.log(`Categoría asignada: ${categoryName}`);
                    // Aplicar la categoría a todos los productos
                    products.forEach(product => {
                        product.productCategory = categoryName;
                    });
                } catch (error) {
                    console.error('Error al categorizar la categoría:', error);
                    products.forEach(product => {
                        product.productCategory = 'Otros';
                    });
                }
            }

            this.products = products;
            return products;
        } catch (error) {
            console.error('Error scraping products:', error);
            return [];
        }
    }

    private async autoScroll() {
        if (!this.page) return;
        
        try {
            await this.page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
        } catch (error) {
            console.error('Error durante el scroll:', error);
        }
    }

    private async categorizeCategory(products: MercadonaProduct[]): Promise<string> {
        try {
            if (!this.DEEPSEEK_API_KEY) {
                console.warn('No se encontró la API key de DeepSeek. Usando categoría por defecto.');
                return 'Otros';
            }

            // Tomar los primeros 5 productos como muestra
            const sampleProducts = products.slice(0, 5).map(p => p.name).join(', ');
            
            const prompt = `Categoriza la siguiente sección de productos de Mercadona en una de estas categorías: 
            - Lácteos y derivados
            - Carnes y embutidos
            - Pescados y mariscos
            - Frutas y verduras
            - Panadería y bollería
            - Bebidas y refrescos
            - Snacks y aperitivos
            - Congelados
            - Conservas
            - Cereales y desayunos
            - Dulces y chocolates
            - Limpieza y hogar
            - Higiene y cuidado personal
            - Otros

            Productos de ejemplo: ${sampleProducts}
            Total de productos en la categoría: ${products.length}
        

            Responde SOLO con el nombre de la categoría más apropiada.`;
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto en categorización de productos de supermercado.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 50
                })
            });

            if (!response.ok) {
                throw new Error(`Error en la API de DeepSeek: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error al categorizar categoría:', error);
            return 'Otros';
        }
    }

    async saveToJson(products: MercadonaProduct[], filename: string) {
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const filePath = path.join(dataDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
        console.log(`Products saved to ${filePath}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

async function main() {
    const scraper = new MercadonaScraper();
    try {
        await scraper.initialize();

        let allProducts: MercadonaProduct[] = [];
        // la categoria maxima de mercadona es 244
        for (let i = 27; i <= 244; i++) {
            const categoryUrl = `https://tienda.mercadona.es/categories/${i}`;
            console.log(`Probando categoría: ${categoryUrl}`);
            try {
                await scraper.getPage()!.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 1500 });

                // Si la URL es /not-found, salta
                if (scraper.getPage()!.url().includes('/not-found')) {
                    console.log(`Categoría ${i} no encontrada (/not-found), saltando...`);
                    continue;
                }

                // Espera a que carguen los productos (máximo 1.5 segundos)
                try {
                    await scraper.getPage()!.waitForSelector('div[data-testid="product-cell"]', { timeout: 1500 });
                } catch {
                    console.log(`Categoría ${i} sin productos, saltando...`);
                    continue;
                }

                // Extrae los productos
                const products = await scraper.scrapeProducts(categoryUrl);
                if (products.length > 0) {
                    allProducts = [...allProducts, ...products];
                    console.log(`Encontrados ${products.length} productos en la categoría ${i}`);
                } else {
                    console.log(`Categoría ${i} sin productos, saltando...`);
                }
            } catch (e) {
                console.log(`Error en categoría ${i}, saltando...`);
                continue;
            }
        }

        // Manejar Ctrl+C para guardar el progreso
        process.on('SIGINT', async () => {
            console.log('\nInterrupción detectada (Ctrl+C). Guardando productos y cerrando navegador...');
            await scraper.saveToJson(allProducts, 'mercadona_products.json');
            await scraper.close();
            console.log('Datos guardados. ¡Hasta luego!');
            process.exit(0);
        });

        await scraper.saveToJson(allProducts, 'mercadona_products.json');
        console.log(`\nProceso completado. Total de productos encontrados: ${allProducts.length}`);
    } catch (error) {
        console.error('Error en el proceso principal:', error);
    } finally {
        await scraper.close();
    }
}

// Ejecutar el scraper
main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
}); 