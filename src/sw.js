const addResourcesToCache = async (resources) => {
	const cache = await caches.open("v1");
	await cache.addAll(resources);
}

const putInCache = async (request, response) => {
	const cache = await caches.open("v1");
	await cache.put(request, response);
}

const cacheFirst = async (request) => {
	const responseFromCache = await caches.match(request);
	if(responseFromCache) 
		return responseFromCache
	
	const responseFromNetwork = await fetch(request);
	putInCache(request, responseFromNetwork.clone());
	
	return responseFromNetwork;
}

self.addEventListener("install", e => {
	e.waitUntil(
		addResourcesToCache([
			"/",
			"./main.html",
			"./utilities/main.js",
			"./utilities/main.wasm",
			"./data/Transcription.json",
			"./data/Coptic.json",
			"./data/Greek.json",
			"./data/IPA.json",
			"./icons/Icon-16.png",
			"./icons/Icon-32.png",
			"./icons/Icon-80.png",
			"./icons/Icon-96.png",
			"./icons/Transcription-16.png",
			"./icons/Transcription-32.png",
			"./icons/Transcription-80.png",
			"./icons/Transcription-96.png",
			"./icons/HieroLTR-16.png",
			"./icons/HieroLTR-32.png",
			"./icons/HieroLTR-80.png",
			"./icons/HieroLTR-96.png",
			"./icons/HieroRTL-16.png",
			"./icons/HieroRTL-32.png",
			"./icons/HieroRTL-80.png",
			"./icons/HieroRTL-96.png",
			"./icons/Coptic-16.png",
			"./icons/Coptic-32.png",
			"./icons/Coptic-80.png",
			"./icons/Coptic-96.png",
			"./icons/Greek-16.png",
			"./icons/Greek-32.png",
			"./icons/Greek-80.png",
			"./icons/Greek-96.png",
			"./icons/IPA-16.png",
			"./icons/IPA-32.png",
			"./icons/IPA-80.png",
			"./icons/IPA-96.png"
		])
	);
})

self.addEventListener("fetch", e => {
	e.respondWith(cacheFirst(e.request))
})