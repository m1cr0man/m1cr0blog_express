$(document).ready(function() {
	Dropzone.options.imgDropzone = {
		paramName: "file",
		maxFilesize: 10,
		parallelUploads: 2,
		acceptedFiles: "image/*",
		autoProcessQueue: false,
		addRemoveLinks: true,
		init: function() {
			var dropzone = this;

			this.on("addedfile", function(file) {
				$("[name='primary_image']").append(
					"<option value='" + file.name + "'>" + file.name + "</option>"
				);
			});
			this.on("removedfile", function(file) {
				$("[value='" + file.name + "']").remove();
			});
			this.on("sending", function(file, xhr, formData) {
				formData.append("id", $("[name='id']").val());
			});

			$("#post-editor").ajaxForm({success: function(responseText, statusText, xhr, form) {
				alert(responseText);
				$("[name='id']").val(responseText);
				dropzone.processQueue();
			}});
		}
	};
});
