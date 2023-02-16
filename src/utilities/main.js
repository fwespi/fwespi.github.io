let wasm;

(() => {
	Office.initialize =  (reason) => {};
	
	WebAssembly.instantiateStreaming(
			fetch('./utilities/main.wasm')
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
						(length&0xff000000)>>24,
						(length&0x00ff0000)>>16,
						(length&0x0000ff00)>> 8,
						(length&0x000000ff)>> 0)
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
				
				convert: (string) => {
					let ptr = wasm.set(string);
					ptr = obj.instance.exports.convert(ptr);
					const result = wasm.get(ptr);
					return result
				}
			}
		})
})();

function substituteCharacters (event, mapping) {
	Word.run( async context => {		
		const selection = context.document.getSelection();
		for(let n=0; n<mapping.length; n++){
			const char = mapping[n][0];
			const results = selection.search(char, {matchCase: true });
			context.load(results);
			await context.sync();
			for(let i = 0; i < results.items.length; i++) {
				results.items[i].insertText(mapping[n][1], "replace");
			};
		};
		await context.sync();
	});
	
	if(event)
		event.completed();
};

async function convertTransliteration (event) {
	const response = await fetch('./data/Transliteration.json');
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertCoptic (event) {
	const response = await fetch('./data/Coptic.json');
	const data = await response.json();
	substituteCharacters(event, data.map);
};

async function convertGreek (event) {
	const response = await fetch('./data/Greek.json');
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
			txt = wasm.convert(txt);
			selection.insertText(txt, "replace");
		}
		await context.sync();
	});
		
	if(event)
		event.completed();
};
