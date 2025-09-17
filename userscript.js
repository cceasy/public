function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
function replaceSpanContentById(sid, txt) {
    var span = document.getElementById(sid);
    while( span.firstChild ) {
        span.removeChild( span.firstChild );
    }
    span.appendChild( document.createTextNode(txt) );
}
function replaceSpanContentByClass(clz, txt, index=0) {
    var span = document.getElementsByClassName(clz)[index]
    while( span.firstChild ) {
        span.removeChild( span.firstChild );
    }
    span.appendChild( document.createTextNode(txt) );
}
function fillInputById(tid, txt)
{
    // var text = document.getElementById("firsttextbox").value;
    // document.getElementById("secondtextbox").value = text;
    document.getElementById(tid).value = txt;
}
function fillInputByClass(clz, txt, index=0)
{
    var span = document.getElementsByClassName(clz)[index].value = txt;
}
function fillInputByName(name, txt, index=0)
{
    var span = document.getElementsByName(name)[index].value = txt;
}
function appendJs(src, defer=true)
{
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.defer = true
    script.src = 'src'; 
    // script.textContent = 'console.log("Hello from Tampermonkey in the header!");';
    document.head.appendChild(script);
}

function demo() {
    'use strict';
    addGlobalStyle('#content { background: grey !important; }');
    addGlobalStyle('.app-bar-title { color: white !important; }');
    addGlobalStyle('.icon path { fill: white; }');
    replaceSpanContentByClass('app-bar-username', 'Welcome Jiahao');
    fillInputByName('init-username', 'jiahao.liu@x.com', 1);
}
