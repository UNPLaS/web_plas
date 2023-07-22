const knowdledgeListURL = 'https://raw.githubusercontent.com/Heldeg/test-knowdledge-list/main/knowledge-list.json';

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
    const moduleList = `<div class="survey-knowledge" id="mod-${modNumber}">
    ${knowledgeExtraClasses ? "" : `<h2>Módulo ${modNumber}</h2>`}
    <div class="survey-knowledge-list ${knowledgeExtraClasses}">
        ${checkboxItems}
    </div>
</div>`;
    return moduleList;
}

function loadMod0(module0Info) {
    const mod0div = document.getElementById("basicRequirements");
    mod0div.innerHTML = createModList(0, module0Info, knowledgeExtraClasses = "d-flex justify-content-start")
}

async function loadLists() {
    try {
        const knowdledgeList = await getknowledgeList();
        const modsRow = document.getElementById("modRequirements");

        loadMod0(knowdledgeList["0"]);

        let htmlModContent = '';
        for (let i = 1; i < Object.keys(knowdledgeList).length; i++) {
            htmlModContent += `<div class="col-md-4" ${i>3 ? "hidden": ""}>${createModList(i, knowdledgeList[i])}</div>`;
        }

        modsRow.innerHTML = htmlModContent;

    } catch (error) {
        console.log(error);
    }
}

loadLists();