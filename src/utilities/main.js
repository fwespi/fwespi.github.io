(() => {
	Office.initialize =  (reason) => {};
})();

function substituteCharacters (event, mapping) {
	Word.run( async context => {
		const selection = context.document.getSelection();
		context.load(selection, "text");
		await context.sync();
		
		let txt = selection.text;
		for(let n=0; n<mapping.length; n++){
			txt.replaceAll(mapping[n][0], mapping[n][1])
		}
		selection.insertText(txt, "replace");
		
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