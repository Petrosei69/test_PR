let excelData = null;
let tg = window.Telegram.WebApp; // Инициализация Telegram Web App

// Сообщаем телеграму что приложение готово
tg.ready();

// Загрузка Excel файла при старте
fetch('МТС PR45.xlsx')
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка загрузки файла');
        }
        return response.arrayBuffer();
    })
    .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const distribution = XLSX.utils.sheet_to_json(workbook.Sheets['Распределение']);
        excelData = distribution;
    })
    .catch(error => {
        showNotification('Ошибка загрузки данных. Обратитесь к администратору.');
    });

document.getElementById('searchBtn').addEventListener('click', searchData);

function searchData() {
    if (!excelData) {
        showNotification('Подождите, данные загружаются...');
        return;
    }

    const nameInput = document.getElementById('name').value;
    const companyInput = document.getElementById('company').value;
    const resultContainer = document.getElementById('result');

    if (!nameInput || !companyInput) {
        showNotification('Пожалуйста, заполните все поля');
        resultContainer.style.display = 'none';
        return;
    }

    const normalizedInput = nameInput.toLowerCase().replace(/ё/g, 'е').trim();
    
    // Сначала ищем только по ФИО
    const foundByName = excelData.find(row => {
        const normalizedName = row['ФИО'].toLowerCase().replace(/ё/g, 'е').trim();
        return normalizedName === normalizedInput;
    });

    if (!foundByName) {
        showNotification('ФИО не найдено, проверьте правильность заполнения');
        resultContainer.style.display = 'none';
        return;
    }

    // Теперь ищем совпадение по ФИО и компании
    const match = excelData.find(row => {
        const normalizedName = row['ФИО'].toLowerCase().replace(/ё/g, 'е').trim();
        return normalizedName === normalizedInput && row['Компания'] === companyInput;
    });

    if (!match) {
        showNotification(`Для ${nameInput} нет сценария с компанией ${companyInput}`);
        resultContainer.style.display = 'none';
        return;
    }

    // Формируем названия для поиска
    const firstScenarioColumn = `${match['Компания']} ${match['Обращение 1']}`;
    const secondScenarioColumn = `${match['Компания']} ${match['Обращение 2']}`;

    // Ищем соответствующие столбцы
    const allColumns = Object.keys(excelData[0]);
    const firstScenarioColumnFound = allColumns.find(col => col === firstScenarioColumn);
    const secondScenarioColumnFound = allColumns.find(col => col === secondScenarioColumn);

    // Получаем значения из первой строки найденных столбцов
    let firstScenario = firstScenarioColumnFound ? excelData[0][firstScenarioColumnFound] : null;
    let secondScenario = secondScenarioColumnFound ? excelData[0][secondScenarioColumnFound] : null;

    // Если сценарии найдены, заменяем в них <Сценарий> на соответствующий текст
    if (firstScenario) {
        const scenarioNumber = match['Сценарий'];
        let scenarioText = excelData[0][scenarioNumber];
        
        if (scenarioText) {
            scenarioText = scenarioText
                .split('\n')
                .map(line => `<div style="padding-left: 20px;">• ${line}</div>`)
                .join('');
            
            firstScenario = firstScenario.replace(/<Сценарий>/g, `\n\n<i>${scenarioText}</i>`);
        }
    }

    if (secondScenario) {
        const scenarioNumber = match['Сценарий'];
        let scenarioText = excelData[0][scenarioNumber];
        
        if (scenarioText) {
            scenarioText = scenarioText
                .split('\n')
                .map(line => `<div style="padding-left: 20px;">• ${line}</div>`)
                .join('');
            
            secondScenario = secondScenario.replace(/<Сценарий>/g, `\n\n<i>${scenarioText}</i>`);
        }
    }

    const result = `
        <div style="font-size: 16px; line-height: 1.5; white-space: pre-line;">
Добрый день, <strong>${match['ФИО']}</strong>!

Вам потребуется выполнить два сценария на устройстве: <strong>${match['Устройство']}</strong>
Вы выполняете тестирование ботов по компании <strong>${match['Компания']}</strong>

Для <strong>первой</strong> проверки вам необходимо проверить работу <strong>${match['Обращение 1']}а</strong> по следующему сценарию:
${firstScenario || `Не найден сценарий для столбца "${firstScenarioColumn}"`}

Для <strong>второй</strong> проверки вам необходимо проверить работу <strong>${match['Обращение 2']}а</strong> по следующему сценарию:
${secondScenario || `Не найден сценарий для столбца "${secondScenarioColumn}"`}

По завершению просим вас заполнить анкету: ССЫЛКА</div>`;

    resultContainer.innerHTML = result;
    resultContainer.style.display = 'block';
}

function showNotification(message) {
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Показываем уведомление в следующем кадре
    requestAnimationFrame(() => {
        notification.style.display = 'block';
        
        // Запускаем исчезновение через 2 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500); // Время должно совпадать с transition в CSS
        }, 2000);
    });
} 