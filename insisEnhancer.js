//TODO: do konfigu

const dictionary = {
    SubjectCode: ["Kód", "Code"],
    SubjectName: ["Předmět", "Subject"]
}

const facultiesToLoad = [10,30,40,60]
let inited = false;
//
$(document.body).append(`<div id="obdobiWrapper" style="display:none"></div>`)
$(document.body).append(`<div id="predmetWraper" style="display:none"></div>`)
let $obdobiWrapper = $("#obdobiWrapper")
let $predmetWrapper = $("#predmetWraper")

function getElementsByContent(baseSelector, dictionaryValues){
    return $(baseSelector).filter(function() {
        return dictionaryValues.some(x => x == $(this).text());
    })
}

function getFakultaBySubject(subject){
    for(fakultyIndex in subjectFacultyMap){
        if(subjectFacultyMap[fakultyIndex].includes(subject))
            return fakultyIndex
    }
    return -1;
}

async function fetchHtml(url){
    let HTML = "";
    await fetch(url).then(function (response) {
        return response.text();
    }).then((html) => {
        HTML = html
    }).catch(function (err) {
        console.warn('Something went wrong.', err);
    });

    var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    while (SCRIPT_REGEX.test(HTML)) {
        HTML = HTML.replace(SCRIPT_REGEX, "");
    }

    return HTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processRow({row, $codeTh}){
    let obdobi = $("#semester-select").val()//"2584";
    
    //
    for(const facultyId of facultiesToLoad){
        if($(`#obdobiFakulty${facultyId}`).length != 0) continue;
        let obdobiHTML = await fetchHtml(`https://insis.vse.cz/auth/student/hodnoceni.pl?fakulta=${facultyId};`)
        $obdobiWrapper.append(`<div id="obdobiFakulty${facultyId}"></div>`)
        $obdobiWrapper.find(`#obdobiFakulty${facultyId}`).append(obdobiHTML)
    } 
    //

    let $append;
    const $row = $(row);
    $row.append(`<td class="added-element">Načítám</td>`)
    $append = $row.find("td").last();

    const normalCodeIndex = $codeTh.index();
    const insisCode = $row.find(`a[href*="/auth/katalog/syllabus.pl"]`).attr("href")?.replace("/auth/katalog/syllabus.pl?predmet=","");

    let normalCode = $row.find(`td:nth-child(${normalCodeIndex + 1})`).text();

    let prehled;

    if(!inited){
        inited = true;

        for(const facultyId of facultiesToLoad){
            //console.log($obdobiWrapper.find(`#obdobiFakulty${facultyId}`))
            let customObdobi = ($obdobiWrapper.find(`#obdobiFakulty${facultyId}`).find(`table *:contains('${obdobi}')`).closest("tr").find("a").attr("href") || "").replace(`hodnoceni.pl?fakulta=${facultyId};obdobi=`,"")
            const href = `https://insis.vse.cz/auth/student/hodnoceni.pl?fakulta=${facultyId};obdobi=${customObdobi}`;
            prehled = await fetchHtml(href);
            $(document.body).append(`<div class="fak" id="fakultaHelperWrapper${facultyId}" style="display:none"></div>`)
            $(`#fakultaHelperWrapper${facultyId}`).html(prehled)
            $(".UISTMNumberCellHidden").remove()
        };
    }

    let predmetFacultyId = "#" + $(`.fak *:contains(${normalCode})`).first().closest(".fak").attr("id")

    let prehledPredmetuURL = $(`${predmetFacultyId} tr:nth-child(${$(`${predmetFacultyId}`).find(`tr:contains('${normalCode}')`).index() + 1}) img`).closest("a").attr("href");

    if(!prehledPredmetuURL){
        $append.html("Předmět nenalezen")
        console.warn("nenalezen předmět")
        return;
    }

    let prehledPredmetu = await fetchHtml(prehledPredmetuURL);

    $append.html(`<a href="${prehledPredmetuURL}">Načítám</a>`)
    $append = $row.find("td").last().find("a");

    const $prehledPredmetu = $predmetWrapper.html(prehledPredmetu)

    let prosly = []
    let neprosly = []
    
    $prehledPredmetu.find("table").first().find("tr td").each(function(){

        let tryParse = parseInt($(this).text())

        if(Number.isInteger(tryParse)){
            if(prosly.length < 3){
                prosly.push(tryParse)
                return;
            }
            if(neprosly.length < 3)
                neprosly.push(tryParse)          
        }
    })

    $prehledPredmetu.find("table").first().find("tr:nth-child(2) td").each(function(){
        let tryParse = parseInt($(this).text())

        if(Number.isInteger(tryParse)){
            if(prosly.length < 6){
                prosly.push(tryParse)
                return;
            }
            if(neprosly.length < 6)
                neprosly.push(tryParse)          
        }
    })

    let procenta = "100%";
    if(neprosly.length != 0){
        const neproslyCount = neprosly.reduce((a, b) => a + b, 0)
        procenta = ~~((neproslyCount / (prosly.reduce((a, b) => a + b, 0) + neproslyCount)) * 100)+ "%"
    }

    $append.html(procenta)
    //const endpointHref = `https://insis.vse.cz/auth/student/hodnoceni.pl?fakulta=${fakulta};obdobi=${obdobi};odkud=;;predmet=${insisCode};pismeno=`
    //console.log(endpointHref)
}

async function calculateSuccessRate(){
    let $codeThArr = getElementsByContent("th", dictionary.SubjectCode).toArray();

    for(codeTh of $codeThArr){

        let $codeTh = $(codeTh);
        let $subjectTables = $codeTh.closest("table")

        for(let table of $subjectTables.toArray()){
            const $table = $(table);
            
            $table.find("thead > .zahlavi").append(`<td class="added-element">Neúspěšnost</td>`)

            for(let row of $table.find("tr:not(.zahlavi)").toArray()){
                await processRow({row, $codeTh})
            }

        };
    }
}

function toggleNavBar(bool){
    $(".success-rate-panel-loading").toggle(bool);
    $(".success-rate-panel-loaded").toggle(!bool);
}

$(document).ready(async function() {
    let barInited = false;
    let $wrapper = $(`
        <div>
            <div class="expand-btn">
                +
            </div>
            <div class="success-rate-panel">
                <div class="success-rate-panel-loaded" style="display:none">
                    <select id="semester-select">
                    </select>
                    <button class="btn" type="button" style="background:gray">Získat data o úspěšnosti</button>
                    <br>
                    *Zatím nefunguje pro zápočtové předměty
                    <br>
                    Autor: Matěj Lajtkep <a href="https://bettervse.lajtkep.dev">web</a>
                </div>
                <div class="success-rate-panel-loading">
                    Načítám
                </div>
                <div class="collapse-btn">
                    -
                </div>
            </div>
        </div>`)
    $(document.body).append($wrapper);

    $wrapper.find("button").on("click",async () => {
        toggleNavBar(true);
        inited = false;
        $(".fak,.added-element").remove();
        await calculateSuccessRate();
        toggleNavBar(false);
    })

    function toggleBar(){
        let visible = $wrapper.find(".success-rate-panel").is(":visible")
        $wrapper.find(".expand-btn").toggle(visible)
        $wrapper.find(".success-rate-panel").toggle(!visible)
    }

    $wrapper.find(".expand-btn").on("click",async () => {
        initBar();
        toggleBar()
    })

    $wrapper.find(".collapse-btn").on("click",async () => {
        toggleBar()
    })

    async function initBar(){
        if(barInited) return
        barInited = true;

        let html = await fetchHtml('https://insis.vse.cz/auth/student/hodnoceni.pl?fakulta=40')

        let $tmp = $(`<div id="obdobiFetch" style="display:none"></div>`)
        $(document.body).append($tmp);

        toggleNavBar(false);

        $tmp.append(html);
        $tmp.find(".UISTMNumberCellHidden").remove();

        $tmp.find("#tmtab_1 tr:not(.zahlavi)").each(function(){
            let $this = $(this);
            const obdobi = $this.find("td:nth-child(1)").text().replace(" - FIS","");
            $wrapper.find("#semester-select").append(`<option value="${obdobi}">
                ${obdobi}
            </option>`)
        })

        $wrapper.find("#semester-select").selectpicker({
            liveSearch:true,
            size: 6
        });

        const response = await fetch('https://bettervse.lajtkep.dev/lastVersion.php', {
            method: 'GET'
        });

        if(response.text() !== '0.17'){
            $(".success-rate-panel").append("Novější verze je dostupná na <a href='https://bettervse.lajtkep.dev/'>Zde</a>")
        }
    }
})