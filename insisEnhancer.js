function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function init(){
    const $wrapper = $(`<div id="cp-wrapper" class="closed">
    <div>`)

    const $opener = $(`<div id="cp-opener">+<div>`)

    $(document.body).append($wrapper)
    $(document.body).append($opener)

    $opener.on("click", function(){
        $opener.hide();
        $wrapper.show()
    })
}

init();