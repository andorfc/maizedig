/**
	Creates a tagging application that links to the database using ajax
	
	Dependencies:
		1. All of the dependencies taggable.js
 *
 * Updated by Kyoung Tak Cho
 * Updated date: Jun 11 00:51:13 CDT 2019
**/
function TaggerUI(image, parent, originalData, imageMetadata, genomicInfo, imagesUrl, siteUrl, alreadyLoaded, callback) {
	this.image = image;
	this.parent = parent;
	this.originalData = originalData;
	this.genomicInfo = genomicInfo;
	this.imagesUrl = imagesUrl;
	this.siteUrl = siteUrl;
	this.imageMetadata = imageMetadata;
	this.title = "";
	this.callback = callback;
	this.alreadyLoaded = alreadyLoaded;
	this.created = false;
	
	for (var i = 0; i < imageMetadata.organisms.length; i++) {
		this.title += imageMetadata.organisms[i].commonName;
		if (i < imageMetadata.organisms.length - 1) {
			this.title += ", ";
		}
	}
	
	$(this.image).zoomable({
		callback: Util.scopeCallback(this, this.createStructure),
		zoom_callback: Util.scopeCallback(this, this.resizeCanvas),
		zoom_callback_args: [this.imageMetadata.id],
		alreadyLoaded: this.alreadyLoaded
	});
};

TaggerUI.prototype.deleteTagE = function(TagID) {	
    var tag = new Tag(TagID, null, null, null, null, [], this.imageMetadata.id, this.siteUrl, null);
    var tags = this.drawingAPI.getTagBoard().getSelectedTags();

    // deletes the tag
    tag.delete(
        Util.scopeCallback(this, function(TagID) {
            tag.setId(TagID);
            callback();
        }),
        function(errorMessage) {
            errorCallback(errorMessage);
        }
    );
    
    deleteGeneLinksFromGBrowse(tags);
};

TaggerUI.prototype.createStructure = function() {	
	// create the toolbar
	var id = this.imageMetadata.id;
	
	this.menu = this.getToolbar(id);
	this.taggingMenu = this.getTaggingMenu(id);
	
	this.parent.prepend(this.menu.getUI());
	this.parent.prepend(this.taggingMenu.getUI());
	
	this.__renderGeneLinksMenu();
	
	var pageBlock = new PageBlock();
	var saveTagDialog = new SaveTagDialog(pageBlock);
	var newTagGroupDialog = new NewTagGroupDialog(pageBlock);
	var newGeneLinkDialog = new NewGeneLinkDialog(pageBlock, this.imageMetadata.organisms, this.siteUrl);
	var deleteGeneLinkDialog = new DeleteGeneLinkDialog(pageBlock, this.imageMetadata.organisms, this.siteUrl);
	var changeCurrentTagGroupsDialog = new ChangeCurrentTagGroupsDialog(pageBlock);
	var downloadImageDataDialog = new DownloadImageDataDialog(pageBlock, this.image, this.imagesUrl);
	var editNotesDialog = new EditNotesDialog(pageBlock, this.siteUrl);
    var editQtlsDialog = new EditQtlsDialog(pageBlock, this.siteUrl);

	var dialogs = {
		'saveTags' : saveTagDialog,
		'newTagGroup' : newTagGroupDialog,
		'newGeneLink' : newGeneLinkDialog,
		'editNotes' : editNotesDialog,
        'editQtls' : editQtlsDialog,
		'changeCurrentGroups' : changeCurrentTagGroupsDialog,
		'downloadImageData' : downloadImageDataDialog
	};
	
	// creates the tag board and the drawing board
	var tagBoard = $('<div />', {
		id      : id + '-tag-board',
		'class' : 'tag-board'
	}).prependTo(this.image.parent());
	
	tagBoard.draggable();
	
	var drawingBoard = $('<canvas />', {
		id      : id + '-drawing-board',
		'class' : 'drawing-board'
	}).prependTo(this.image.parent());
	
	// creates the drawing API
	this.drawingAPI = new DrawingAPI(drawingBoard, tagBoard, dialogs, this.siteUrl, this.originalData, this.image, this.imageMetadata, this.genomicInfo);
	
	var $tagGroupSelect = this.parent.find('#' + id + '-tag-groups');
	var groups = this.drawingAPI.getTagBoard().getTagGroups();
	for (key in groups) {
		var group = groups[key];
		$tagGroupSelect.append($('<option />', {
			'text' : group.getName(),
			'name' : group.getId()
		}));
	}
	
	var self = this;
	
	// events for clicking the start and stop drawing buttons
	this.menu.getSection('tags').getMenuItem('addNewTag').onClick(function() {
		self.drawingAPI.startTagging();
		self.taggingMenu.show();
	});
	
	// events for clicking the 'Delete Tag' button
	this.menu.getSection('tags').getMenuItem('deleteTag').onClick(function() {
        // Get selected Tag ID
	    var selectedTagID = $(".tag-info").attr("id");
        var nPos = selectedTagID.indexOf("-");
        selectedTagID = selectedTagID.substring(0, nPos);

        // delete selected Tag
        self.deleteTagE(selectedTagID);
        // Show message
        alert("Tag has been deleted. Please reload your image if needed.");
        //this.redraw();

	});
	
	this.menu.getSection('tagGroups').getMenuItem('addNewTagGroup').onClick(function() {
		newTagGroupDialog.show();
	});
	
	this.menu.getSection('tagGroups').getMenuItem('changeCurrentGroups').onClick(function() {
		changeCurrentTagGroupsDialog.show();
	});
	
	this.menu.getSection('tools').getMenuItem('toggleTags').onClick(function() {
		self.drawingAPI.getTagBoard().toggleTags();
	});
	
	this.menu.getSection('tools').getMenuItem('zoomIn').onClick(function() {
		self.image.zoomable("zoom", 1);
	});
	
	this.menu.getSection('tools').getMenuItem('zoomOut').onClick(function() {
		self.image.zoomable("zoom", -1);
	});

	this.menu.getSection('tools').getMenuItem('download').onClick(function() {
		downloadImageDataDialog.show();
	});

	this.menu.getSection('geneLinks').getMenuItem('addNewLink').onClick(function() {
		newGeneLinkDialog.show(self.drawingAPI.getTagBoard());
	});
	
    // Delete Gene Link
	this.menu.getSection('geneLinks').getMenuItem('deleteLink').onClick(function() {
		deleteGeneLinkDialog.show(self.drawingAPI.getTagBoard());
	});

    // Add/Edit Image Notes
    this.menu.getSection('imageNotesQTLs').getMenuItem('editNotes').onClick(function() {
        editNotesDialog.show(self.imageMetadata);
    });
	// Add/Edit QTLs
	this.menu.getSection('imageNotesQTLs').getMenuItem('editQtls').onClick(function() {
		editQtlsDialog.show(self.imageMetadata);
	});
	
	this.taggingMenu.onCancelClick(function() {
		self.drawingAPI.endTagging();
	});	
	
	// changes the color of the currently drawn tag or just of the paint brush itself
	this.taggingMenu.onColorClick(function() {
		var color = $(this).css('background-color');
		//console.log(color);
		
		var newFillStyle = "";
		var rgbArr = color.split("(")[1].split(")")[0].split(",");
		if (parseInt($.trim(rgbArr[0])) + parseInt($.trim(rgbArr[1])) + parseInt($.trim(rgbArr[2])) != 0)
			newFillStyle = "rgba(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ", 0.2)";
		else
            newFillStyle = "rgba(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ", 0.2)";
		//console.log(newFillStyle);
		self.drawingAPI.setFillStyle(newFillStyle);
		self.drawingAPI.getDrawingBoard().redraw();
	});
	

	// buttons for switching between drawing in rectangular form and polygonal form
	this.taggingMenu.onRectClick(function() {
		self.drawingAPI.setShape('rect');
		self.drawingAPI.startTagging();
	});
	
	this.taggingMenu.onPolyClick(function() {
		self.drawingAPI.setShape('poly');
		self.drawingAPI.startTagging();
	});
	
	
	// submits the currently drawn tag
	this.taggingMenu.onSubmitClick(function() {
		var dwBoard = self.drawingAPI.getDrawingBoard();
        var tagPoints = dwBoard.getCurrentTagPoints();// self.drawingBoard.getCurrentTagPoints();
		//console.log(tagPoints.length);
        if (tagPoints.length > 0) {
            self.drawingAPI.saveTag();
        }
        else
		{
            alert('Warning: Please select tagging area.');
		}
	});
	
	var left = parseInt(this.image.css('left').split('px')[0]);
	var top = parseInt(this.image.css('top').split('px')[0]);
	
	// sizes everything correctly based on the image specifics
	// also draws the original tags if they exist
	this.created = true;
	this.resizeCanvas();
	
	// since the tagBoard has to be above the image we must make it drag the image with it
	this.drawingAPI.getTagBoard().getBoard().bind('drag', function(event, ui) {
		self.image.css('left', $(this).css('left')).css('top', $(this).css('top'));
		self.drawingAPI.getDrawingBoard().getBoard().css('left', $(this).css('left')).css('top', $(this).css('top'));
	});
	
	if (this.callback) {
		this.callback();
	}
};

TaggerUI.prototype.resizeCanvas = function() {
	if (this.created) {
		var $canvas = this.drawingAPI.getDrawingBoard().getBoard();
		var $tagBoard = this.drawingAPI.getTagBoard().getBoard();
		var $img = this.image;
		
		// drawing board
		$canvas.css('left', $img.css('left')).css('top', $img.css('top'));
		$canvas[0].height = $img.height();
		$canvas[0].width = $img.width();
		
		// tag board
		$tagBoard.css('left', $img.css('left')).css('top', $img.css('top'));
		$tagBoard.height($img.height());
		$tagBoard.width($img.width());
		
		this.drawingAPI.getTagBoard().redraw();
		this.drawingAPI.getDrawingBoard().redraw();
	}
};

TaggerUI.prototype.getToolbar = function(id) {
	var menu = new Menu();
	
	// create tools menu section
	var tools = new MenuSection('Tools', this.imagesUrl + 'tools.png');
	tools.addMenuItem('download', 'Download Image Data', 'ui-icon ui-icon-disk', false);
	tools.addMenuItem('zoomIn', 'Zoom In', 'ui-icon ui-icon-zoomin', false);
	tools.addMenuItem('zoomOut', 'Zoom Out', 'ui-icon ui-icon-zoomout', false);
	tools.addMenuItem('toggleTags', 'Toggle All Tag Visibility', this.imagesUrl + 'eye.png', true);
	menu.addNewSection('tools', tools);
	
	// create tag groups menu section
	var tagGroups = new MenuSection('Tag Groups', this.imagesUrl + 'tagGroupIcon.png');
	tagGroups.addMenuItem('addNewTagGroup', 'Add New Tag Group', 'ui-icon ui-icon-plusthick', false);
	tagGroups.addMenuItem('changeCurrentGroups', 'Change Current Tag Groups', 'ui-icon ui-icon-pencil', false);
	menu.addNewSection('tagGroups', tagGroups);
	
	// create tag groups menu section
	var tags = new MenuSection('Tags', this.imagesUrl + 'tag.png');
	tags.addMenuItem('addNewTag', 'Add New Tag', 'ui-icon ui-icon-plusthick', false);
	tags.addMenuItem('deleteTag', 'Delete Tag', 'ui-icon ui-icon-trash', false);
	menu.addNewSection('tags', tags);
	
	// create gene links menu section
	var geneLinks = new MenuSection('Gene Links', this.imagesUrl + 'geneLinksIcon.png');
	geneLinks.addMenuItem('addNewLink', 'Add New Link To Tag', 'ui-icon ui-icon-plusthick', false);
	geneLinks.addMenuItem('deleteLink', 'Delete Link From Tag', 'ui-icon ui-icon-trash', false);
	menu.addNewSection('geneLinks', geneLinks);

	// create image note and QTL menu section
    var imageNotesQTLs = new MenuSection('Notes/QTLs', this.imagesUrl + 'polygonButtonIcon.png');
	imageNotesQTLs.addMenuItem('editNotes', 'Add/Edit Image Notes', 'ui-icon ui-icon-plusthick', false);
    imageNotesQTLs.addMenuItem('editQtls', 'Add/Edit QTLs', 'ui-icon ui-icon-plusthick', false);
	menu.addNewSection('imageNotesQTLs', imageNotesQTLs);

	return menu;
};

TaggerUI.prototype.getTaggingMenu = function(id) {
	return new TaggingMenu(id, this.imagesUrl);
};

/**
 * Renders the Gene Links Menu UI which is in charge of adding new links 
 * to the current tag
**/
TaggerUI.prototype.__renderGeneLinksMenu = function() {
	var id = this.imageMetadata.id;
	
	// adds the title to the Gene Links Menu
	var genomicInfoTitle = $('<div />', {
		'class' : 'organismTitle',
		text : this.title
	});
	
	this.genomicInfo.html(genomicInfoTitle);
	
	var info = $('<div />', {
		'class' : 'imageInfo'
	});
	
	var speciesInfo = $('<div />', {
		'class' : 'speciesInfo'
	});
	
	speciesInfo.append(this.__renderSpeciesInfo());
	info.append(speciesInfo);
	
	// adds the geneLinks menu
	var geneLinksInfo = $('<div />', {
		'class' : 'geneLinksInfo'
	});
	
	var geneLinksTitle = $('<div />', {
		'class' : 'geneLinksInfoTitle',
		'text' : 'Gene Links'
	});
	
	var geneLinksContainer = $('<div />', {
		'class' : 'tagInfoContainer'
	});
	
	geneLinksInfo.append(geneLinksTitle);
	geneLinksInfo.append(geneLinksContainer);
	
	info.append(geneLinksInfo);
	
	this.genomicInfo.append(info);
	this.genomicInfo.attr('id', id + 'GeneLinkContainer');
};

/**
 * Renders the species info portion of the gene links menu,
 * which will be shown when no tag is moused over or clicked
 */
TaggerUI.prototype.__renderSpeciesInfo = function() {
	var speciesInfo = $('<table cellspacing="0" />', {
		
	});

    // Image ID
    var imageIDRow = $('<tr />', {
        'class' : 'odd'
	});
    var imageIDLabel = $('<td />', {
        'text' : 'Image ID:'
    });
    var imageIDContext = $('<td />', {
        'text' : this.imageMetadata.id
    });
    imageIDRow.append(imageIDLabel);
    imageIDRow.append(imageIDContext);
    speciesInfo.append(imageIDRow);

	// description of image
	var descriptionRow = $('<tr />', {
        'class' : 'even'
	});
	var descriptionLabel = $('<td />', {
		'text' : 'Description:'
	});
	var description = $('<td />', {
		'text' : this.imageMetadata.description
	});
	descriptionRow.append(descriptionLabel);
	descriptionRow.append(description);
	speciesInfo.append(descriptionRow);

    // Gene ID
    //alert(this.imageMetadata.geneIDs.length);
	if (this.imageMetadata.geneIDs.length == 0) {
        var geneIDRow = $('<tr />', {
            'class': 'odd'
        });
        var geneIDLabel = $('<td />', {
            'text': 'Gene ID:'
        });
        var geneID = $('<td />', {
            'text': 'null'
        });
        geneIDRow.append(geneIDLabel);
        geneIDRow.append(geneID);
        speciesInfo.append(geneIDRow);
	}
    for (var i = 0; i < this.imageMetadata.geneIDs.length; i++) {
        var geneIDRow = $('<tr />', {
            'class': 'odd'
        });
        if (i == 0) {
            var geneIDLabel = $('<td />', {
                'text': 'Gene ID:'
            });
        }
        else {
            var geneIDLabel = $('<td />', {
                'text': ' '
            });
        }

        // Set version string (short form)
        var versionStr =  this.imageMetadata.geneIDs[i].version;
        var versionAssm = '';
        var genomeAssmURL = "";
        switch (versionStr.toLowerCase()) {
            case "v3":
            case "v4":
            //case "b73 refgen_v4":
                versionAssm = "";
                genomeAssmURL = "https://www.maizegdb.org/assembly";
                break;
            default:
                versionAssm = versionStr;
                genomeAssmURL = "https://www.maizegdb.org/genome/genome_assembly/";
        }

        var geneIDCell = $('<td />');
        var geneIDGeneModelPage = $('<a />', {
            'text' : this.imageMetadata.geneIDs[i].geneID,
            'style' : 'margin-left: 20px; margin-right: 20px; font-size: 12px',
            'target' : '_blank',
            'href' : 'https://www.maizegdb.org/gene_center/gene/' + this.imageMetadata.geneIDs[i].geneID
        });

        var geneIDAssemblyPage = $('<a />', {
            'text' : versionStr,
            'style' : 'font-size: 12px',
            'target' : '_blank',
            'href' : genomeAssmURL + versionAssm
        });
        geneIDCell.append(geneIDGeneModelPage);
        geneIDCell.append(geneIDAssemblyPage);
        geneIDRow.append(geneIDLabel);
        geneIDRow.append(geneIDCell);
        speciesInfo.append(geneIDRow);
    }

	// Gene Symbol
	var geneSymbolRow = $('<tr />', {
        'class' : 'even'
	});
	var geneSymbolLabel = $('<td />', {
		'text' : 'Gene Symbol:'
	});
	var geneSymbol = $('<td />', {
		'text' : this.imageMetadata.geneSymbol
	});
    geneSymbolRow.append(geneSymbolLabel);
    geneSymbolRow.append(geneSymbol);
    speciesInfo.append(geneSymbolRow);

    // Gene Name
    var geneNameRow = $('<tr />', {
        'class' : 'odd'
	});
    var geneNameLabel = $('<td />', {
        'text' : 'Gene Name:'
    });
    var geneName = $('<td />', {
        'text' : this.imageMetadata.geneName
    });
    geneNameRow.append(geneNameLabel);
    geneNameRow.append(geneName);
    speciesInfo.append(geneNameRow);

	// upload date data
	var uploadDateRow = $('<tr />', {
        'class' : 'even'
	});
	var uploadDateLabel = $('<td />', {
		'text' : 'Uploaded on:'
	});
	var uploadDate = $('<td />', {
		'text' : this.imageMetadata.uploadDate
	});
	uploadDateRow.append(uploadDateLabel);
	uploadDateRow.append(uploadDate);
	speciesInfo.append(uploadDateRow);

	// uploader data
	var uploaderRow = $('<tr />', {
        'class' : 'odd'
	});
	var uploaderLabel = $('<td />', {
		'text' : 'Uploaded by:'
	});
	var uploader = $('<td />', {
		'text' : this.imageMetadata.uploadedBy
	});
	uploaderRow.append(uploaderLabel);
	uploaderRow.append(uploader);
	speciesInfo.append(uploaderRow);

    // QTL information
    var qtlRow = $('<tr />', {
        'class' : 'even'
    });
    var qtlLabel = $('<td />', {
        'text' : 'QTL:'
    });
    var qtl = $('<td />', {
        'text' : this.imageMetadata.qtl
    });
    qtlRow.append(qtlLabel);
    qtlRow.append(qtl);
    speciesInfo.append(qtlRow);

	// Image notes
    var notesRow = $('<tr />', {
        'class' : 'odd'
    });
    var notesLabel = $('<td />', {
        'text' : 'Notes:'
    });
    var notesByStr = '';
    if (this.imageMetadata.notesBy.length > 0)
    	notesByStr = ' (by '	 + this.imageMetadata.notesBy + ')';
    var notesContext = $('<td />', {
        'text' : this.imageMetadata.notes + notesByStr
    });
    notesRow.append(notesLabel);
    notesRow.append(notesContext);
    speciesInfo.append(notesRow);

	return speciesInfo;
};

function deleteGeneLinksFromGBrowse(tags) {
    var picID = document.getElementById("current-editing").name;
    var updateTrackURL = "https://gbrowse.maizegdb.org/etc/MaizeDIG/del_gene_link.php";
    var geneList = "";
    $.each(tags, function(id, tag) {
        var geneLinks = tag.getGeneLinks();
        for (i=0; i<geneLinks.length; i++) {
            geneList = (i == 0) ? geneLinks[i].getName() : geneList + "," + geneLinks[i].getName();
        }
    });
    $.ajax({
        url : updateTrackURL,
        type : 'POST',
        data : {
            geneList : geneList,
            imageID : picID
        },
        success : function(data, textStatus, jqXHR) {
            if (data.indexOf("Error") != -1) {
                //Encountered an error on gblade script
                alert(data);
            }
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // var errorMessage = $.parseJSON(jqXHR.responseText).message;
            alert("Error: textStatus: " + textStatus); 
            alert("Error: errorThrown: " + errorThrown);
        }
    });
    
}
