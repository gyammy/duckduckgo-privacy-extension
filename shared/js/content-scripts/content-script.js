var requestTypes = {
    'iframe': 'sub_frame',
    'frame': 'sub_frame',
    'script': 'script',
    'img': 'image',
    'input': 'image',
    'object': 'object',
    'embed': 'object',
    'link': 'stylesheet'
};

var onBeforeLoad = (e) => {
    let frame = (window === window.top) ? "main_frame" : "sub_frame"

    if (e.url) {
        if (!e.url.match(/^https?:\/\/|^\/\//)) return

        let requestDetails = {
            currentURL: e.target.baseURI,
            potentialTracker: e.url,
            frame: frame,
            mainFrameURL: getLocation(),
            type: requestTypes[e.target.nodeName.toLowerCase()] || 'other',
            hidden: document.hidden
        }

        //console.log(`MAYBE BLOCK ${e.url}`)
        let block = safari.self.tab.canLoad(e, requestDetails)
        if (block.cancel) {
            //console.log(`DDG BLOCKING ${e.url}`)
            e.preventDefault()
        } else if (block.redirectUrl) {
            //console.log(`DDG BLOCKING AND USING SURROGATE ${e.url}`)
            e.preventDefault()
            loadSurrogate(block.redirectUrl)
        }
    }

}

var onBeforeUnload = (e) => {
    safari.self.tab.dispatchMessage('unloadTab', {
        unload: getLocation()
    })
}

// return location without params
var mainFrameURL
function getLocation () {
    // content script only works from window.top and will throw
    // errors if it runs in iframes. Try to access hostname and
    // bail if there are any errors.
    try {
        window.top.location.hostname
    } catch (e) {
        return
    }

    if (mainFrameURL) { return mainFrameURL }
    var loc = window.top.location
    mainFrameURL = loc.protocol + "//" + loc.hostname + loc.pathname
    return mainFrameURL
}

// serve surrogate content
var loadSurrogate = function(url) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = url
    sp = document.getElementsByTagName('script')[0];
    sp.parentNode.insertBefore(s, sp);
}

if (window === window.top) {
    window.addEventListener('beforeunload', onBeforeUnload, true);
}

document.addEventListener('beforeload', onBeforeLoad, true);
