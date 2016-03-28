frappe.provide('frappe.ui.form');

frappe.ui.form.quick_entry = function(doctype, success) {
	frappe.model.with_doctype(doctype, function() {
		var mandatory = $.map(frappe.get_meta(doctype).fields,
			function(d) { return (d.reqd || d.bold) ? d : null });

		var doc = frappe.model.get_new_doc(doctype);

		if($.map(mandatory, function(d) { return d.fieldtype==='Table' ? d : null }).length) {
			// has mandatory table, quit!
			frappe.set_route('Form', doctype, doc.name);
			return;
		}


		var dialog = new frappe.ui.Dialog({
			title: __("New {0}", [doctype]),
			fields: mandatory,
		});

		// set defaults
		mandatory.forEach(function(df) {
			var field = dialog.get_field(df.fieldname);
			field.doctype = doc.doctype;
			field.docname = doc.name;
			if(doc[df.fieldname]) {
				field.set_value(doc[df.fieldname]);
			}
		});

		dialog.set_primary_action(__('Save'), function() {
			var values = dialog.get_values();

			if(values) {
				values.doctype = doctype;
				frappe.call({
					method: "frappe.client.insert",
					args: {
						doc: values
					},
					callback: function(r) {
						dialog.hide();
						var doc = r.message;
						if(success) success(doc);
					},
					error: function() {
						dialog.hide();
						frappe.set_route('Form', doctype, doc.name);
					},
					freeze: true
				});
			}
		});

		$('<div class="text-muted small" style="padding-left: 10px; padding-top: 15px;">\
			Ctrl+enter to save</div>').appendTo(dialog.body);

		// ctrl+enter to save
		dialog.wrapper.keydown("meta+return ctrl+return", function(e) {
			if(!frappe.request.ajax_count) {
				// not already working -- double entry
				dialog.get_primary_btn().trigger("click");
			}
		});

		dialog.show();
	});
}