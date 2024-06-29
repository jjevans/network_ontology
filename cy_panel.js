
function populate_panel(data){
	var id = data.id;
	var term = data.term;
	var desc = data.desc;
	var parent_term = data.parent_term;
	//var parent_desc = data.parent_desc;

	$('#term').html(term);
	$('#parent').html(parent_term);
	$('#desc').html(desc);
	
	return;
}

function panel_tree(data){
	var rows = new Array();
	var term = data.term;
	var desc = data.desc;
	var parent_term = data.parent_term;
	var parent_desc = data.parent_desc;

	$('.panel_tree').remove();//clear out table
	
	if(typeof parent_term === 'undefined'){//no parent (root node)
		parent_term = 'root';
		parent_desc = parent_desc;
	}
	rows.push("<tr class='panel_tree'><td class='panel_tree_0'>- " + parent_term + "</td><td class='panel_tree_1'>" + parent_desc + "</td></tr>");
	
	rows.push("<tr class='panel_tree' id='target_node'><td>++ " + term + "</td><td>" + desc + "</td></tr>");
	
	data.children.forEach(function(kid){
		var row = "<tr class='panel_tree kids'><td>----- " + kid.term + "</td><td>" + kid.description + "</td></tr>";
		rows.push(row);
	});
	
	$('#empty_row').after(rows.join(''));
	
	return;
}

function td(content){ return "<td>" + content + "</td>" }
function tr(content){ return "<tr>" + content + "</td>" }
