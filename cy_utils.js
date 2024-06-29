		var node_color = "red";
		var highlight_color = "blue";
		var edge_opacity = 0.4;//opacity of edges
		var node_bg_opacity = 0.4;//opacity of nodes not related to clicked
		var node_fg_opacity = 1;//nodes related to clicked
		var fg_class = "foreground";
		var lbl_fld_bg = "term";
		var lbl_init = "data("+lbl_fld_bg+")";//id, term, description, label fields for node label
		var lbl_fld_fg = "description";
		var dbltap_timelen = 300;//time needed between click to call them doubleclick
		var fit_padding = 40;
		var fit_duration = 1000;//length animation (1000 millisec)
	
		var cola_layout = {
			name: 'cola',
			randomize: false,
			avoidOverlap: true,
			nodeDimensionsIncludeLabels: false,
			handleDisconnected: true,
			maxSimulationTime: 30000,
			refresh: 2,
			fit: false,
			flow: true
		};
		function init_cy(elements){

			var cy = cytoscape({
				container: document.getElementById('cy'),
				style: [
					{
						selector: 'node',
						style: {
							'content': lbl_init,
							//'content': 'data(id)',
							'background-color': node_color,
							'width': '5px',
							'height': '5px',
							'shape': 'octagon'
						}
					},
					{
						selector: 'edge',
						style: {
							'opacity': edge_opacity
						}
					}],
				elements: elements,
				layout: cola_layout,
				zoom: 1,
				pan: { x: 0, y: 0 },
				minZoom: 1e-50,
				maxZoom: 1e50,
				zoomingEnabled: true,
				userZoomingEnabled: true,
				panningEnabled: true,
				userPanningEnabled: true,
				boxSelectionEnabled: true,
				selectionType: 'single',
				touchTapThreshold: 8,
				desktopTapThreshold: 4,
				autolock: false,
				autoungrabify: false,
				autounselectify: false,
				wheelSensitivity: 0.15
			});	

/*			cy.animate({
				fit: {
					eles: cy.nodes(),
					padding: fit_padding
				}},
				{ duration: fit_duration });
*/

			cy.ready(function(event){
				/*cy.on('grab', 'node', function(event) {
					var node = event.target;
					var rule = cy.automove(am_opts);
					rule.apply();
				});*/
				var tappedBefore;
				var tappedTimeout;
								
				cy.on('tapstart', 'node', function(event){
					var node_target = event.target;
					var node_id = node_target.data('id');
					
					var node_info = {//info for panel
						id: node_id,
						term: node_target.data('term'),
						desc: node_target.data('description'),
						children: new Array()
					}
				
					//ondoubleclick, stackoverflow
					var tappedNow = event.cyTarget;
					if(tappedTimeout && tappedBefore){
					    clearTimeout(tappedTimeout);
					}
					if(tappedBefore === tappedNow){
						event.node = node_info;
						process_cy(event);
						tappedBefore = null;
					}
					else{
						tappedTimeout = setTimeout(function(){ tappedBefore = null; }, dbltap_timelen);
						tappedBefore = tappedNow;
					}

					$('#reset').click(function(event){
						cy.$('.'+fg_class).removeClass(fg_class);
						cy.nodes()
							.each(function(node){
								node.style({label: node.data(lbl_fld_bg), 'background-opacity': node_fg_opacity, 'background-color': node_color})
							});

						exec_layout();
					});
					
					populate_panel(node_info);
					panel_tree(node_info);
				});
				
				console.log('ready');
			});

			return cy;
		}

		function exec_layout(class_to_fit=null){
			//execute layout and animate to fit elements
			cy.layout(cola_layout).run();
			
			var eles_to_animate;
			if(class_to_fit == null){
				eles_to_animate = cy.nodes()
			}
			else{
				eles_to_animate = cy.$('.'+class_to_fit);	
			}
			
			cy.clearQueue();
			cy.animate({
				fit:{
					eles: eles_to_animate,
					padding: fit_padding
					}
				},
				{ duration: fit_duration }
			);
			
			return;
		}
		
		function process_cy(event){
			var node_target = event.target;
			var node_info = event.node;
	
			cy.batch(function(){
				cy.nodes()
				.filter(function(node){return node != node_target})
				.each(function(d){
					d.style({label: d.data(lbl_fld_bg), 'background-opacity': node_bg_opacity, 'background-color': node_color});
					d.removeClass(fg_class);
				});
			});

			node_target.addClass(fg_class);//clicked node
			
			//children of clicked node
			node_target
			.connectedEdges()
				.each(function(edge){
					if(edge.target() != node_target){
						node_info.children.push({
						term: edge.target().data('term'),
						description: edge.target().data('description')});
					}
					edge.target().style({'background-color': node_color});
					edge.target().addClass(fg_class);
				});
				
			//parent of clicked node	
			cy.edges()
				.filter(function(edge){return edge.target() == node_target})
				.each(function(edge){
					edge.source().style({'background-color': highlight_color});
					edge.source().addClass(fg_class);

					node_info.parent_term = edge.source().data('term');
					node_info.parent_desc = edge.source().data('description');
				});
	
			//clicked node, children, parent to style (class = fg_class)			
			cy.$('.'+fg_class).each(function(d){
				d.style({label: d.data(lbl_fld_fg), 'background-opacity': node_fg_opacity});
			});
			
			cola_layout.nodeDimensionsIncludeLabels = true;
			exec_layout(fg_class);
			cola_layout.nodeDimensionsIncludeLabels = false;//set back
			
			return;
		}

		function subgraph(terms, root, num_gen, hide=false){
			var elems = [{group: 'nodes', data: {id: root, label: terms[root].label, term: terms[root].term}}];
			
			terms.lastparent = root;
			return add_kids(terms, elems, root, num_gen);
		}

		function add_kids(terms, elems, parent, num_gen, hide=false){
	
			terms[parent].children.forEach(function(kid){
				node = {group: 'nodes', data: {id: kid, term: terms[kid].term, label: terms[kid].label, description: terms[kid].description}, classes: 'center-right'};
				edge = {group: 'edges', data: {source: parent, target: kid}};
				
				if(hide){ node.style = {display: 'none'}; edge.style = {display: 'none'} }
				//if(hide){ node.style = {visibility: hidden}; edge.style = {visibility: hidden} }

				elems.push(node, edge);
	
				if(typeof num_gen === 'undefined' || (typeof num_gen === 'number' && num_gen > 0)){
					if(typeof num_gen === 'number'){
						num_gen--;
					}
					elems = add_kids(terms, elems, kid, num_gen);
				}
			});
			
			return elems;
		}
