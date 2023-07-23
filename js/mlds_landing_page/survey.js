const knowdledgeListURL = 'https://raw.githubusercontent.com/Heldeg/test-knowdledge-list/main/knowledge-list.json';
const prevBtn = document.getElementById("surveyPrevBtb");
const nextBtn = document.getElementById("surveyNextBtb");
const sendBtn = document.getElementById("surveySendBtb");

let numPages = 0;
let currentPage = 0;
let knowdledgeList = {}

async function getknowledgeList() {
    const response = await fetch(knowdledgeListURL);
    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const knowdledgeList = await response.json();
    return knowdledgeList;
}

function createknowledgeItem(knowledText, checkboxId) {
    const checkboxHtml = `<div class="form-check">
    <input class="form-check-input" type="checkbox" value="${knowledText}" id="${checkboxId}">
    <label class="form-check-label" for="${checkboxId}">
       ${knowledText}
    </label>
</div>`;
    return checkboxHtml;
}

function concatKnowledItems(modNumber, moduleInfo) {
    const items = [...moduleInfo["primary"], ...moduleInfo["secondary"]];
    const knowledgeArray = [];
    for (let i = 0; i < items.length; i++) {
        knowledgeArray.push(createknowledgeItem(items[i], `cb-${modNumber}-${i}`));
    }
    return knowledgeArray;
}

function createModList(modNumber, moduleInfo, knowledgeExtraClasses = "") {
    const knowdledgeItems = concatKnowledItems(modNumber, moduleInfo);
    let checkboxItems = ""
    for (let item of knowdledgeItems) {
        checkboxItems += item + "\n"
    }
    const moduleList = `<div class="survey-knowledge">
    ${knowledgeExtraClasses ? "" : `<h2>Módulo ${modNumber}</h2>`}
    <div class="survey-knowledge-list ${knowledgeExtraClasses}">
        ${checkboxItems}
    </div>
</div>`;
    return moduleList;
}

function loadMod0(module0Info) {
    const mod0div = document.getElementById("mod-0-list");
    mod0div.innerHTML = createModList(0, module0Info, knowledgeExtraClasses = "d-flex justify-content-start")
}

async function loadLists() {
    try {
        knowdledgeList = await getknowledgeList();
        const modsRow = document.getElementById("modRequirements");
        const numModules = Object.keys(knowdledgeList).length;
        //Mod 0 is in first page, therefore subtract one
        numPages = parseInt((numModules - 1) / 3);
        currentPage = 1;

        loadMod0(knowdledgeList["0"]);

        let htmlModContent = '';
        for (let i = 1; i < numModules; i++) {
            htmlModContent += `<div class="col-md-4 animation" ${i > 3 ? "hidden" : ""} id="mod-${i}-list">${createModList(i, knowdledgeList[i])}</div>`;
        }

        modsRow.innerHTML = htmlModContent;

    } catch (error) {
        console.log(error);
    }
}

function updateSurvey() {
    toggleBtns();
    toggleKnowledgeList();
}

function toggleBtns() {
    if (currentPage < numPages) {
        nextBtn.removeAttribute("hidden");
    } else {
        nextBtn.setAttribute('hidden', 'true');
    }

    if (currentPage > 1) {
        prevBtn.removeAttribute("hidden");
    } else {
        prevBtn.setAttribute('hidden', 'true');
    }

    if (currentPage === numPages) {
        sendBtn.removeAttribute("hidden");
    } else {
        sendBtn.setAttribute('hidden', 'true');
    }
}

function toggleKnowledgeList() {
    const minMod = currentPage * 3 - 2
    const maxMod = currentPage * 3
    const numModules = Object.keys(knowdledgeList).length;
    const mod0div = document.getElementById("mod-0-list");

    if (currentPage === 1) {
        setTimeout(() => {mod0div.removeAttribute("hidden") }, 200);
        setTimeout(() => {
            mod0div.classList.remove("hide");
        }, 100);
    } else {
        mod0div.classList.add("hide");
        setTimeout(() => {
            mod0div.setAttribute('hidden', 'true');
        }, 200);

    }



    for (let i = 1; i < numModules; i++) {
        let modeCol = document.getElementById(`mod-${i}-list`);
        if (i >= minMod && i <= maxMod) {
            setTimeout(() => {modeCol.removeAttribute("hidden") }, 200);
            setTimeout(() => {
                modeCol.classList.remove("hide");
            }, 100);
        } else {
            modeCol.classList.add("hide");
            setTimeout(() => { modeCol.setAttribute('hidden', 'true'); }, 200);
        }
    }

}

prevBtn.addEventListener("click", e => {
    currentPage -= 1;
    updateSurvey();
});

nextBtn.addEventListener("click", e => {
    currentPage += 1;
    updateSurvey();
});

loadLists();