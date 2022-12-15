const formScriptURL = 'https://script.google.com/macros/s/AKfycbxDJBq_op0k84MZsO6PSZYFGVj3KlqoWrUC0GawJLwG8VhOGbzEvS6QzleONSoCP_jV/exec';
const datesScriptURL = 'https://script.google.com/macros/s/AKfycbxYeUL_ANUZrxqPQtT5ZhtoPQAT5OUgkJ6E6xPr_dgMyO1ovWr9I8Co6BammKm_cX4KJA/exec'
const form = document.forms['contactForm'];
const emailInputElement = document.getElementById('emailForm');
const selectInputElement = document.getElementById('interestForm');


const isInvalidClassName = 'is-invalid'

function validateEmail(emailText) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailText)
}

function validateInterestSelect(selectElement) {
    return selectElement.value !== "" || selectElement.value !== null;
}

function checkForm() {

    let isInputsValid = true;

    if (!validateEmail(emailInputElement.value)) {
        emailInputElement.classList.add(isInvalidClassName);
        isInputsValid = false;
    }

    if (!validateInterestSelect(selectInputElement)) {
        selectInputElement.classList.add(isInvalidClassName);
        isInputsValid = false;
    }
    if (!isInputsValid) {
        return isInputsValid
    }
    emailInputElement.classList.remove(isInvalidClassName);
    selectInputElement.classList.remove(isInvalidClassName);
    return isInputsValid;
}

function showSuccesFormAlert() {
    const succesAlertElement = document.getElementById('succesAlertForm');
    succesAlertElement.hidden = false;
    setTimeout(() => { succesAlertElement.hidden = true; }, 5000)
}

function showErrorFormAlert() {
    const succesErrorElement = document.getElementById('errorAlertForm');
    succesErrorElement.hidden = false;
    setTimeout(() => { succesErrorElement.hidden = true; }, 5000)
}

function getDates() {
    fetch(datesScriptURL, {
        method: 'GET', headers: {
            'Accept': 'application/json',
        },
    })
        .then(response => {return response.json()}).then(dates => updateDate(dates.values))
        .catch(response => console.log(response))
}

function updateDate(dateInfo) {
    dateInfo.forEach(modInfo => {
        const modNumber = modInfo['module']
        const startDayEl = document.getElementById(`mod-${modNumber}-startDay`)
        const startMonthEl = document.getElementById(`mod-${modNumber}-startMonth`)
        const endDayEl = document.getElementById(`mod-${modNumber}-endDay`)
        const endMonthEl = document.getElementById(`mod-${modNumber}-endMonth`)

        const startDate = modInfo['start_date'].split('/')
        const endDate = modInfo['end_date'].split('/')

        startDayEl.innerHTML = startDate[0]
        startMonthEl.innerHTML = getMonthName(startDate[1])
        endDayEl.innerHTML = endDate[0]
        endMonthEl.innerHTML = getMonthName(endDate[1])

    })
}


function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);

    return date.toLocaleString('es', { month: 'long' });
}



emailInputElement.addEventListener('change', e => {
    if (!validateEmail(emailInputElement.value)) {
        emailInputElement.classList.add(isInvalidClassName);
    } else {
        emailInputElement.classList.remove(isInvalidClassName);
    }
});


form.addEventListener('submit', e => {
    e.preventDefault()
    if (checkForm()) {
        fetch(formScriptURL, { method: 'POST', body: new FormData(form) })
            .then(showSuccesFormAlert())
            .catch(showErrorFormAlert())
    }

});

getDates()