var anonymized = [];
var anonDictionaries = {};
var useHeaders = true;

function saveAnonymizedData(d) {
	if (jQuery.isEmptyObject(anonymized))
		return;
	var blob = new Blob(anonymized, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "anonymized_home_data.csv");
}

function saveMappings(d) {
	if (jQuery.isEmptyObject(anonDictionaries))
		return;
	//var blob = new Blob([JSON.stringify(anonDictionaries)], {type: "text/plain;charset=utf-8"});
	//saveAs(blob, "mappings.json");
	for (var key in anonDictionaries) {
		if (anonDictionaries.hasOwnProperty(key)) {
			var string = ""
			for (var item in anonDictionaries[key]) {
				string += item;
				string += ",";
				string += anonDictionaries[key][item];
				string += "\n"
			}
			var blob = new Blob([string], {type: "text/plain;charset=utf-8"});
			saveAs(blob, key.concat("_key.csv"));
		}
	}
}


function anonymize(file, anonConfig) {
	var reZipCode = /.*(\d{2})(\d{4}).*/g;
	var results = Papa.parse(file, {
		newline: "\n",
		worker: true,
		header: useHeaders,
		step: function(row) {
			var columns = row.data[0];
			if (columns.length === 1) { return; }

			anonConfig.forEach(function(item) {
				var selector;
				if (useHeaders)
					selector = item.name;
				else
					selector = item.index;

				if (item.anon_type == 0) {
					columns[selector] = "";
				} else if (item.anon_type == 1) {
					if (anonDictionaries[item.name] == null) {
						anonDictionaries[item.name] = {};
					}
					if (columns[selector] != null) {
						var col = columns[selector];
						col.replace(/\s/g, "").toLowerCase();
						var anonFieldValue = anonDictionaries[item.name][col];
						if (anonFieldValue == null) {
							anonFieldValue = Object.keys(anonDictionaries[item.name]).length;
							anonDictionaries[item.name][col] = anonFieldValue;
						}
						columns[selector] = anonFieldValue;
					}
				} else if (item.anon_type == 2) {
					if (columns[selector] != null)
						columns[selector].replace(reZipCode, "$1");
				} else if (item.anon_type == 4) {
					var date = new Date(columns[selector]);
					columns[selector] = date.getFullYear();
				}
			});
			anonymized = anonymized.concat(columns.join(",")+"\n");
		},

		complete: function() {
			console.log("All done!");
		}
	});
}

$.getJSON('./conf/anonymize.conf', function(data) {
		var anonConfig = data;
		Dropzone.options.myDropzone = {
		init: function() {
			var self = this;

			self.options.maxFiles = 1;
			self.options.createImageThumbnails = false;
			self.options.addRemoveLinks = true;
			self.options.dictRemoveFile = "Delete";

			self.on("addedfile", function(file) {
				anonymize(file, anonConfig);
			});

			// Send file starts
			self.on("sending", function(file) {
				console.log('upload started', file);
			});

			// On removing file
			self.on("removedfile", function(file) {
				anonymized = [];
				anonDictionaries = {};

				console.log("removedfile ", file);
			});
		}
	};
});
