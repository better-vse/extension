$(document).ready(async function() {
    $(`select[name='selucitel']`).addClass("selucitel");
    $(`select[name='selucitel']`).parent().find("input").addClass("btn").addClass("custom-btn")

    $(`select[name='selucitel']`).selectpicker({
        liveSearch: true,
        size: 8
    })
})