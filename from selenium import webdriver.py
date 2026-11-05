from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def search_exist(query):
    # Настройки браузера
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # фоновый режим
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    # Запуск браузера
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    try:
        # Открытие страницы поиска
        url = f"https://www.exist.ru/SearchResult/?search={query}"
        driver.get(url)
        
        # Ждём прогрузки результатов 
        time.sleep(5)

        # Извлечение товаров
        products = driver.find_elements(By.CSS_SELECTOR, ".item-row")

        print(f"Найдено {len(products)} результатов по запросу '{query}':\n")

        for product in products[:5]:  # выводим первые 5 товаров
            title = product.find_element(By.CSS_SELECTOR, ".desc-name a").text.strip()
            price = product.find_element(By.CSS_SELECTOR, ".price-current").text.strip()
            link = product.find_element(By.CSS_SELECTOR, ".desc-name a").get_attribute("href")
            print(f"{title}\nЦена: {price}\nСсылка: {link}\n{'-'*40}")

    except Exception as e:
        print("Ошибка:", e)
    finally:
        driver.quit()

# Пример использования
if __name__ == "__main__":
    search_query = "LX1211"  # Артикул запчасти
    search_exist(search_query)