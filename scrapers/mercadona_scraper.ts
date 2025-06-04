import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface MercadonaProduct {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
}

class MercadonaScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private readonly baseUrl = 'https://tienda.mercadona.es/';

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
            await this.page.goto(categoryUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            
            console.log('Esperando a que los productos se carguen...');
            await this.page.waitForSelector('div[data-testid="product-cell"]', { timeout: 30000 });
            console.log('Productos cargados');

            console.log('Iniciando scroll automático...');
            await this.autoScroll();
            console.log('Scroll completado');

            console.log('Extrayendo datos de productos...');
            const products = await this.page.evaluate(() => {
                const productElements = document.querySelectorAll('div[data-testid="product-cell"]');
                return Array.from(productElements).map(product => {
                    // Nombre en h4[data-testid="product-cell-name"]
                    const nameElement = product.querySelector('h4[data-testid="product-cell-name"]');
                    // Precio en p[data-testid="product-price"]
                    const priceElement = product.querySelector('p[data-testid="product-price"]');
                    const imageElement = product.querySelector('img');
                    return {
                        name: nameElement?.textContent?.trim() || '',
                        price: priceElement?.textContent?.trim() || '',
                        image: imageElement?.getAttribute('src') || '',
                        category: window.location.href,
                        description: ''
                    };
                });
            });

            console.log(`Se extrajeron ${products.length} productos`);
            return products;
        } catch (error) {
            console.error('Error scraping products:', error);
            return [];
        }
    }

    private async autoScroll() {
        if (!this.page) return;
        
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
        for (let i = 27; i <= 300; i++) {
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
