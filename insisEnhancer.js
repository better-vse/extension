function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function init(){
    const $wrapper = $(`<div id="cp-wrapper" class="closed">
        <div id="cp-closer">-</div>
    <div>`)

    const $opener = $(`<div id="cp-opener">+<div>`)
    $(document.body).append($wrapper)
    $(document.body).append($opener)
    const $closer = $("#cp-closer")

    $opener.on("click", function(){
        $opener.hide();
        $wrapper.show()
    })
    $closer.on("click", function(){
        $opener.show();
        $wrapper.hide()
    })
}

init();