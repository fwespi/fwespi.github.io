let wasm;

const registerServiceWorker = async () => {
	if("serviceWorker" in navigator){
		try {
			const registration = await navigator.serviceWorker.register("/sw.js", {scope: "/"});
			if(registration.installing){
				console.log("Service worker installing");
			} else if(registration.waiting){
				console.log("Service worker installed");
			} else if(registration.active){
				console.log("Service worker active");
			}
		} catch (error) {
			console.error(`Registration failed with ${error}`);
		}
	}
}

registerServiceWorker();

(() => {
	Office.initialize =  (reason) => {};
	
	WebAssembly.instantiateStreaming(
			fetch("./utilities/main.wasm")
		).then( obj => {
			wasm = {
				allocate_memory: obj.instance.exports.allocate_memory,
				deallocate_memory: obj.instance.exports.deallocate_memory,
				
				set: (string) => {
					const bytes = new TextEncoder().encode(string);
					const length = bytes.byteLength;
					const ptr = wasm.allocate_memory(length + 4);
					const buffer = new Uint8Array(obj.instance.exports.memory.buffer, ptr, length + 4 + 1); 
					buffer.set(Uint8Array.of(
						(length&0x000000ff)>> 0,
						(length&0x0000ff00)>> 8,
						(length&0x00ff0000)>>16,
						(length&0xff000000)>>24)
					);
					buffer.set(bytes, 4);
					return ptr;
				}, 
				
				get: (ptr) => {
					const length = new Uint32Array(obj.instance.exports.memory.buffer, ptr, 4)[0];
					const bytes = new Uint8Array(obj.instance.exports.memory.buffer, ptr+4, length);
					const string = new TextDecoder("utf-8").decode(bytes);
					wasm.deallocate_memory(ptr, length + 4);
					return string;
				},
				
				convert_to_transcription: (string) => {
					let ptr = wasm.set(string);
					ptr = obj.instance.exports.convert_to_transcription(ptr);
					const result = wasm.get(ptr);
					return result
				},
				
				convert_to_hieroglyphs: (string) => {
					let ptr = wasm.set(string);
					ptr = obj.instance.exports.convert_to_hieroglyphs(ptr);
					const result = wasm.get(ptr);
					return result
				},
				
				search_hieroglyphs: (string) => {
					let ptr = wasm.set(string);
					ptr = obj.instance.exports.search_hieroglyphs(ptr);
					const result = wasm.get(ptr);
					if(result != "")
						return result.split(" | ");
					else
						return [];
				}
			}
		})
})();

window.addEventListener("load", () => {
	const input = document.querySelector("#hieroglyphicInput input");
	
	input.value = "";
	
	input.addEventListener("beforeinput", handleBeforeInput);
	input.oninput = handleInput;
	
	window.addEventListener("keydown", e => {
		if(e.key == "Enter"){
			e.preventDefault();
			const selection = document.querySelector(".selected");
			if(selection)
				selection.click();
		}
		
		if(e.key == "ArrowDown"){
			e.preventDefault();
			const selection = document.querySelector(".selected");
			if(selection && selection.nextSibling){
				selection.classList.remove('selected');
				selection.nextSibling.classList.add('selected');
				document.querySelector("#hieroglyphicInput div")
					.scroll(0, selection.nextSibling.offsetTop);
			}
		}
		
		if(e.key == "ArrowUp"){
			e.preventDefault();
			const selection = document.querySelector(".selected");
			if(selection && selection.previousSibling){
				selection.classList.remove('selected');
				selection.previousSibling.classList.add('selected');
				document.querySelector("#hieroglyphicInput div")
					.scroll(0, selection.previousSibling.offsetTop);
			}
		}
		
	});
	
});

function handleBeforeInput (e) {
	if(!e.data) return;
	
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
	const data = wasm.convert_to_transcription(e.data);
	const before = e.target.value.slice(0, e.target.selectionStart);
	const after = e.target.value.slice(e.target.selectionEnd);
	
	e.target.value = before + data + after;
	e.target.value = e.target.value
		.replace(/ꜣꜣ([0-9])/g, "AA$1") 
		.replace(/ꜣ([0-9])/g, "A$1") 
		.replace(/ḏ([0-9])/g, "D$1") 
		.replace(/ḥ([0-9])/g, "H$1") 
		.replace(/Ỉ([0-9])/g, "I$1") 
		.replace(/Ḳ([0-9])/g, "K$1") 
		.replace(/š([0-9])/g, "S$1") 
		.replace(/ṯ([0-9])/g, "T$1") 
		.replace(/h̭([0-9])/g, "V$1") 
		.replace(/ẖ([0-9])/g, "X$1");
	
	e.target.selectionStart = before.length + data.length;
	e.target.selectionEnd = before.length + data.length;
	
	if(e.target.oninput)
		e.target.oninput();
}

function handleInput (e) {
	const input = document.querySelector("#hieroglyphicInput input");
	const wrapper = document.querySelector("#hieroglyphicInput div");
	wrapper.innerHTML = "";
	
	const options = wasm.search_hieroglyphs(input.value);
	options.forEach( x => {
		const option = document.createElement("div");
		wrapper.appendChild(option);
		option.innerHTML = x;
		
		option.onclick = () => {
			Word.run( async context => {		
				const selection = context.document.getSelection();
				selection.insertText(option.firstChild.textContent, "Replace");
				selection.select("End");
				await context.sync();
				input.value = "";
				wrapper.innerHTML = "";
			});
		}
	})
	
	const firstOption = wrapper.querySelector("div");
	if(firstOption)
		firstOption.className = "selected";
}

function substituteCharacters (event, mapping) {
	Word.run( async context => {		
		const selection = context.document.getSelection();
		context.load(selection, "text");
		await context.sync();
			
		let txt = selection.text;
		for(let n=0; n<mapping.length; n++){
			txt = txt.replaceAll(mapping[n][0], mapping[n][1]);
		};
		selection.insertText(txt, "replace");
		await context.sync();
	});
	
	if(event)
		event.completed();
};

async function convertTranscription (event) {
	const response = await fetch("./data/Transcription.json");
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertCoptic (event) {
	const response = await fetch("./data/Coptic.json");
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertGreek (event) {
	const response = await fetch("./data/Greek.json");
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertIPA (event) {
	const response = await fetch("./data/IPA.json");
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertHieroglyphsLTR (event) {
	convertHieroglyphs(event, false);
}

async function convertHieroglyphsRTL (event) {
	convertHieroglyphs(event, true);
}

async function convertHieroglyphs (event, rtl) {
	Word.run( async context => {		
		const selection = context.document.getSelection();
		context.load(selection, "text");
		await context.sync();
		
		let txt = selection.text;
		if(wasm){
			txt = wasm.convert_to_hieroglyphs(txt);
			selection.insertText(txt, "replace");
			await context.sync();
			
			const start = selection.getRange("start");
			start.load("font");
			await context.sync();
			const fontSize = start.font.size;
			const font = start.font.name;
			txt = applyHieroglyphicFormatControls(txt, font, fontSize, rtl);
			
			selection.insertHtml(txt, "replace");
			selection.select("End");
		}
		await context.sync();
	});
		
	if(event)
		event.completed();
};


function applyHieroglyphicFormatControls (txt, font, fontSize, rtl=false) {
		
	/* font size & family */
	const gap = 2;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	ctx.font = `${fontSize}pt ${font}` ;
	
	/* text measurements */
	const getDimensions = (char) => {
		let dim = [-1, -1];
		
		if(char.indexOf(group_start) == -1){
			const m = ctx.measureText(char);
			dim[0] = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) * 0.75;	//px to pt
			dim[1] = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * 0.75; //px to pt
		} else {
			char.replace(
				new RegExp(`${group_start}\{(.+?) (.+?)\}`), (m, a, b) => {
					dim[0] = parseFloat(a);
					dim[1] = parseFloat(b);
			});
		}
		
		return dim;
	};
	
	/*delimiters*/
	const group_start = "";
	const group_end = "";
	
	/*modifiers*/
	const verticalJoiner = ":";
	const horizontalJoiner = "*";
	const insertTopStart = "°\\|";
	const insertBottomStart = "\\.\\|";
	const insertTopEnd = "\\|°";	
	const insertBottomEnd = "\\|\\.";
	const overlayMiddle = "\\+";
	const segmentStart = "\\(";
	const segmentEnd = "\\)";
	
	console.log(txt);
	console.log(txt.length);
	console.log(/\uD80D\uDC30/g.test(txt));

	txt = txt
		.replace(/\uD80D\uDC30/g, verticalJoiner)				//U+13430
		.replace(/\uD80D\uDC31/g, horizontalJoiner)		//U+13431
		.replace(/\uD80D\uDC32/g, insertTopStart)			//U+13432
		.replace(/\uD80D\uDC33/g, insertBottomStart)		//U+13433
		.replace(/\uD80D\uDC34/g, insertTopEnd)				//U+13434
		.replace(/\uD80D\uDC35/g, insertBottomEnd)		//U+13435
		.replace(/\+/g, overlayMiddle).replace(/\uD80D\uDC36/g, overlayMiddle)	//U+13436
		.replace(/\(/g, segmentStart).replace(/\uD80D\uDC37/g, segmentStart)		//U+13437
		.replace(/\)/g, segmentEnd).replace(/\uD80D\uDC38/g, segmentEnd)		//U+13438
		.replace(/◰/g, insertTopStart.substr(1))
		.replace(/◱/g, insertBottomStart.substr(1))
		.replace(/◳/g, insertTopEnd.substr(1))
		.replace(/◲/g, insertBottomEnd.substr(1));

	/*units*/
	const character = "(?:[\uD800-\uDBFF][\uDC00-\uDFFF])";
	const characterLikeUnit = "(?:" + group_start + "[^" + group_end + "]*" + group_end + ")";
	
	/*groups*/
	const groups = [
		"\\\\"+segmentStart + "(.*?)\\\\"  + segmentEnd,
		"(" + character + "|" + characterLikeUnit + ")\\\\" +	overlayMiddle 	+ "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")" +	insertBottomEnd 	+ "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")" +	insertTopEnd 		+ "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")" +	insertBottomStart + "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")" +	insertTopStart 	+ "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")\\" +	horizontalJoiner 	+ "(" + character + "|" + characterLikeUnit + ")",
		"(" + character + "|" + characterLikeUnit + ")" +	verticalJoiner 	+ "(" + character + "|" + characterLikeUnit + ")"
	]
	
	/*rgx*/
	const rgxCharacters= new RegExp(character, "g");

	const rgx = [];
	groups.forEach(g => rgx.push(new RegExp(g, "g")));
		
	/*handler*/
	const handler = [
	
		/*segment*/
		function(){
			const a = arguments[1];
			
			let w=0, h=0;
			a.replace(new RegExp("(?:" + character + "|" + characterLikeUnit + ")", "g"), m => {
				const dim = getDimensions(m);
				w += dim[0];
				h = Math.max(h, dim[1]);
			});
			
			let c = `{${w} ${h}}<span style='display:none;mso-hide:all'>\u{13437}</span>${a}<span style='display:none;mso-hide:all'>\u{13438}</span>`;
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
		
		/*overlay middle*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = Math.max(dim[0], dim[2]);
			const h = Math.max(dim[1], dim[3]);
			
			let c = `{${w} ${h}}`;
			if(dim[0] > dim[2]){ 
				//a wider than b
					
					if(dim[1] > dim[3]){
						//a taller than b
						const u = (dim[1] - dim[3]) / 2;
						const l = (dim[0] + dim[2]) / 2;
						const r = (dim[0] - dim[2]) / 2;
						c += `${a}`;
						c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
						if(rtl){
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\r ${r}<span style='mso-element:field-end'></span>`;
						} else {
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\r ${r}<span style='mso-element:field-end'></span>`;
						}
						
					} else {
						//b taller than a
						const u = (dim[3] - dim[1]) / 2;
						const l = (dim[0] + dim[2]) / 2;
						const r = (dim[0] - dim[2]) / 2;
						if(rtl){
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} <span style='mso-element:field-end'></span>${a}`;
							c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
						} else {
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} <span style='mso-element:field-end'></span>${a}`;
							c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
						}
						c += `<span style='mso-element:field-begin'></span> ADVANCE \\r ${r} <span style='mso-element:field-end'></span>`;
					}
			} else {
				//b wider than a
					if(dim[1] > dim[3]){
						//a taller than b
						const u = (dim[1] - dim[3]) / 2;
						const r = (dim[2] - dim[0]) / 2;
						const l = (dim[2] + dim[0]) / 2;
						c += `<span style='mso-element:field-begin'></span> ADVANCE \\r ${r} <span style='mso-element:field-end'></span>${a}`;
						c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
						if(rtl){
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} <span style='mso-element:field-end'></span>`;
						} else {
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} <span style='mso-element:field-end'></span>`;
						}
					
					} else {
						//b taller than a
						const u = (dim[3] - dim[1]) / 2;
						const r = (dim[2] - dim[0]) / 2;
						const l = (dim[2] + dim[0]) / 2;
						if(rtl){
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\r ${r} <span style='mso-element:field-end'></span>${a}`;
							c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
						} else {
							c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\r ${r} <span style='mso-element:field-end'></span>${a}`;
							c += `<span style='display:none;mso-hide:all'>\u{13436}</span>`;
							c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
						}
					}
			}
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
	
		/*insertBottomEnd*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = dim[0];
			const h = dim[1];
			const l = dim[2];
			let c = `{${w} ${h}}`
			c += `${a}<span style='display:none;mso-hide:all'>\u{13435}</span>`;
			c += `<span style='mso-element:field-begin'></span> ADVANCE \\l ${l} <span style='mso-element:field-end'></span>${b}`;
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
	
		/*insertTopEnd*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = dim[0];
			const h = dim[1];
			const u = dim[1] - dim[3];
			const l = dim[2];
			
			let c = `{${w} ${h}}`;
			c += `${a}<span style='display:none;mso-hide:all'>\u{13434}</span>`;
			if(rtl){
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l}<span style='mso-element:field-end'></span>${b}`;
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} <span style='mso-element:field-end'></span>`;
			} else {
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l}<span style='mso-element:field-end'></span>${b}`;
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} <span style='mso-element:field-end'></span>`;
			}
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
	
		/*insertBottomStart*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = dim[0];
			const h = dim[1];
			const l = dim[0];
			const r = dim[0] - dim[2];
			let c = `{${w} ${h}}${a}<span style='display:none;mso-hide:all'>\u{13433}</span>`;
			c += `<span style='mso-element:field-begin'></span> ADVANCE \\l ${l}<span style='mso-element:field-end'></span>${b}`;
			c += `<span style='mso-element:field-begin'></span> ADVANCE \\r ${r}<span style='mso-element:field-end'></span>`;
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');
			return group_start + c + group_end;
		},
		
		/*insertTopStart*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = dim[0];
			const h = dim[1];
			const u = dim[1] - dim[3];
			const l = dim[0];
			const r = dim[0] - dim[2];
			let c = `{${w} ${h}}`;
			c += `${a}`;
			c += `<span style='display:none;mso-hide:all'>\u{13432}</span>`;
			if(rtl){
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l}<span style='mso-element:field-end'></span>${b}`;
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\r ${r}<span style='mso-element:field-end'></span>`;
			} else {
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l}<span style='mso-element:field-end'></span>${b}`;
				c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\r ${r}<span style='mso-element:field-end'></span>`;
			}
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
		
		/*horizontalJoiner*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			const w = dim[0] + dim[2] + gap;
			const h = Math.max(dim[1], dim[3]);
			
			let c = `{${w} ${h}}${a}<span style='display:none;mso-hide:all'>\u{13431}</span>`;
			c += `<span style='mso-element:field-begin'></span> ADVANCE \\r ${gap} <span style='mso-element:field-end'></span>${b}`;
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		},
		
		/*verticalJoiner*/
		function(){
			const a = arguments[1];
			const b = arguments[2];
			let c = '';
			
			const dim = [
				...getDimensions(a),
				...getDimensions(b)
			];
			
			if(dim[0] > dim[2]){ 
				//top wider than bottom
				
				const u = dim[3] + gap;
				if(rtl){
					const l = (dim[0] + dim[2]) / 2;
					const r = (dim[0] - dim[2]) / 2;
					c = `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} <span style='mso-element:field-end'></span>${a}`;
					c += `<span style='display:none;mso-hide:all'>\u{13430}</span>`;
					c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
					c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\r ${r} <span style='mso-element:field-end'></span>`;
				}	else {
					const l = (dim[0] + dim[2]) / 2;
					const r = (dim[0] - dim[2]) / 2;
					c = `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} <span style='mso-element:field-end'></span>${a}`;
					c += `<span style='display:none;mso-hide:all'>\u{13430}</span>`;
					c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
					c +=  `<span style='mso-element:field-begin'></span> ADVANCE \\r ${r} <span style='mso-element:field-end'></span>`;
				}
			} else {
				//bottom wider than top
				const u = dim[3] + gap;
				const r = (dim[2] - dim[0]) / 2 ;
				const l = (dim[2] + dim[0]) / 2;
				if(rtl){
					c = `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\r ${r} <span style='mso-element:field-end'></span>${a}`;
					c += `<span style='display:none;mso-hide:all'>\u{13430}</span>`;
					c += `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
				} else {
					c = `<span style='mso-element:field-begin'></span> ADVANCE \\u ${u} \\r ${r} <span style='mso-element:field-end'></span>${a}`;
					c += `<span style='display:none;mso-hide:all'>\u{13430}</span>`;
					c += `<span style='mso-element:field-begin'></span> ADVANCE \\d ${u} \\l ${l} <span style='mso-element:field-end'></span>${b}`;
				}
			}
			
			c = `{${Math.max(dim[0], dim[2])} ${dim[1]+dim[3] + gap}}${c}`;
			c = c.replace(new RegExp(`${group_start}\{.+?\}`, "g"), '');
			c = c.replace(new RegExp(`${group_end}`, "g"), '');

			return group_start + c + group_end;
		}
	]
	
	const applyHandlers = (txt) => {
		for(let n=0; n<groups.length; n++){
			while(rgx[n].test(txt))
				txt = txt.replace(rgx[n], handler[n]);
		}
		
		txt = txt.replace(new RegExp(group_start+"\{.*?\}", "g"), "");
		txt = txt.replace(new RegExp(group_end, "g"), "");

		return txt;
	};
	
	txt = txt.replace(/[\u{202A}\u{202B}\u{202C}\u{202D}\u{202E}]/g, '');
	txt = applyHandlers(txt);
	if(rtl){
		txt = `\u{202E}${txt}\u{202C}`;
		txt = `<span style='font-size:${fontSize}pt; font-family:${font};mso-stylistic-set:1'>${txt}</span>`;
	} else {
		txt = `<span style='font-size:${fontSize}pt; font-family:${font}'>${txt}</span>`;
	}
	
	return txt;
}