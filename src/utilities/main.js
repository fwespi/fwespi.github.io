let wasm;

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
			console.log(selection);
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

async function convertHieroglyphs (event) {
	Word.run( async context => {		
		const selection = context.document.getSelection();
		context.load(selection, "text");
		await context.sync();
		
		let txt = selection.text;
		if(wasm){
			//insert HTML: <span style='display:none;mso-hide:all'>abc</span>
			txt = wasm.convert_to_hieroglyphs(txt);
			selection.insertText(txt, "replace");
			selection.select("End");
		}
		await context.sync();
	});
		
	if(event)
		event.completed();
};
