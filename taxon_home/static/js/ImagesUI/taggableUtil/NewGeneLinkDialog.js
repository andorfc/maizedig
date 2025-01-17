/**
 * Dialog API for adding Gene Link
 *
 * @params pageBlock, organisms, siteUrl
 *
 * Updated by Kyoung Tak Cho
 * Updated date: Mar 7 23:54:39 CDT 2018
 */
function NewGeneLinkDialog(pageBlock, organisms, siteUrl) {
    this.block = pageBlock;
    this.submitUrl = siteUrl + 'api/geneLinks';
    
    this.dialog = $('<div />', {
        'class' : 'tagging-dialog',
    });
    
    this.block = pageBlock;
    
    this.title = $('<div />', {
        'class' : 'tagging-dialog-title',
        'text' : 'Add New Gene Link'
    });
    
    this.closeButton = $('<span />', {
        'class' : 'ui-icon ui-icon-circle-close close-button'
    });
    
    this.title.append(this.closeButton);
    
    this.contents = $('<div />', {
        'class' : 'tagging-dialog-contents'
    });
    
    this.table = $('<table />', {
        'class' : 'dialog-table'
    });
    
    this.contents.append(this.table);
    
    var geneNameContainer = $('<div />');
    
    this.geneName = $('<input />', {
        'type' : 'text'
    });
    
    var nameLabel = $('<span />', {
        'text' : 'Gene or Locus Tag',
        'style' : 'margin-right: 10px'
    });
    
    var geneAlleleContainer = $('<div />');
    
    this.geneAllele = $('<input />', {
        'type' : 'text'
    });
    
    var alleleLabel = $('<span />', {
        'text' : 'Allele (optional)',
        'style' : 'margin-right: 10px'
    });
    
    geneNameContainer.append(nameLabel);
    geneNameContainer.append(this.geneName);
    this.contents.append(geneNameContainer);
    
    geneAlleleContainer.append(alleleLabel);
    geneAlleleContainer.append(this.geneAllele);
    this.contents.append(geneAlleleContainer);
    
    var organismContainer = $('<div />');
    
    this.organism = $('<select />', {
        'type' : 'text'
    });
    
    var self = this;
    
    var option = $('<option />', {
        'text' : 'Zea mays',
        'value' : '25'
    });
    self.organism.append(option);
    
    var organismLabel = $('<span />', {
        'text' : 'Organism',
        'style' : 'margin-right: 10px'
    });
    
    organismContainer.append(organismLabel);
    organismContainer.append(this.organism);
    this.contents.append(organismContainer);
    
    this.finalizeUI = $('<div />', {
        'class' : 'tagging-dialog-contents'
    });
    
    this.finalizeBody = $('<div />');
    
    this.submitGeneLinkButton = $('<button />', {
        'class' : 'tagging-button',
        'text': 'Add'
    });
    
    this.cancelButton = $('<button />', {
        'class' : 'tagging-button',
        'text': 'Cancel',
        'style' : 'margin-left: 10px'
    });
    
    this.finalizeBody.append(this.submitGeneLinkButton);
    this.finalizeBody.append(this.cancelButton);
    this.finalizeBody.css('border-top', '1px solid #CCC');
    this.finalizeBody.css('padding-top', '5px');
    
    this.finalizeUI.append(this.finalizeBody);
    
    this.dialog.append(this.title);
    this.dialog.append(this.contents);
    this.dialog.append(this.finalizeUI);
    
    this.submitCallback = null;
    
    this.submitGeneLinkButton.on('click', Util.scopeCallback(this, this.onSubmit));
    this.cancelButton.on('click', Util.scopeCallback(this, this.onCancel));
    this.closeButton.on('click', Util.scopeCallback(this, this.onCancel));
    
    $('body').append(this.dialog);
};

NewGeneLinkDialog.prototype.onSubmit = function() {
    var geneName = $.trim(this.geneName.val());
    var allele = $.trim(this.geneAllele.val());
    var organismId = this.organism.val();
    var tagId = this.table.find('input:radio[name=tag]:checked').val();
    if (geneName && organismId && tagId) {
        var self = this;
        
        $.ajax({
            url : this.submitUrl,
            type : 'POST',
            data : {
                name : geneName,
                organismId : organismId,
                tagId: tagId,
                allele : allele
            },
            dataType : 'json',
            success : function(data, textStatus, jqXHR) {
                data.feature.organismId = organismId;
                self.tags[tagId].addGeneLink(data.id, data.feature);
                self.hide();
                var subdomain = (window.location.host.split("."))[0];
                if (subdomain == "maizedig") {
                    //jp -- added function to update MaizeDIG track on all genome browsers,
                    //       but only call it on the production maizedig server
                    updateGBrowseTracks(geneName);
                }

                // auto page refresh
                location.reload();
            },
            error : function(jqXHR, textStatus, errorThrown) {
                var errorMessage = $.parseJSON(jqXHR.responseText).message;
                alert(errorMessage);
            }
        });
    }
};

NewGeneLinkDialog.prototype.onCancel = function() {
    this.hide();
};

NewGeneLinkDialog.prototype.hide = function() {
    this.block.hide();
    this.dialog.hide();
};

NewGeneLinkDialog.prototype.show = function(tagBoard) {
    var tags = tagBoard.getSelectedTags();
    if ($.isEmptyObject(tags)) {
        var currentTagGroups = tagBoard.getCurrentTagGroups();
        if ($.isEmptyObject(currentTagGroups)) {
            alert("Please select tags by clicking on them or a current tag group.");
        }
        else {
            tags = {};
            $.each(currentTagGroups, function(key, group) {
                $.extend(tags, group.getTags());
            });
        }
    }
    
    if (!$.isEmptyObject(tags)) {
        this.table.empty();
        var tbody = $('<tbody />');
        
        var index = 0;
        $.each(tags, function(id, tag) {
            var newRow = $('<tr />');
            var text = '';
            if (index == 0) {
                text = 'Select a Tag:';
            }
            
            var labelCell = $('<td />', {
                'text' : text
            });
            
            var tagCell = $('<td />');
            
            tagCell.append($('<input />', {
                'value' : tag.getId(),
                'type' : 'radio',
                'name' : 'tag',
                'checked' : index == 0
            }));
            
            tagCell.append($('<span />', {
                'text' : tag.getDescription()
            }));
            
            newRow.append(labelCell);
            newRow.append(tagCell);
            tbody.append(newRow);
            index++;
        });
    }
    
    this.tags = tags;
    
    this.table.append(tbody);
    this.block.show();
    this.dialog.show();
};


/**
 * Calls a web service on gblade to update the MaizeDIG tracks on all of the genome browsers
 * with the newly linked gene. 
 */
function updateGBrowseTracks(geneName) {   
    var img = document.getElementById("current-editing");            
    var imgID = img.name;
    var imgPath = "";
    var imgElems = document.getElementsByName(imgID);
    for (var i=0; i<imgElems.length; i++) {
        if (imgElems[i].src.indexOf('downsized') >= 0) {
         imgPath = imgElems[i].src;
         break;
        }
    }
    if (imgPath == "") {
        alert("Error! Could not find downsized image to send to gblade...");
    }
    imgPath = imgPath.replace("http://maizedig.maizegdb.org/media/booster/Variation/", "");
    imgPath = imgPath.replace("https://maizedig.maizegdb.org/media/booster/Variation/", "");
    var updateTrackURL = "https://gbrowse.maizegdb.org/etc/MaizeDIG/add_gene_link.php";
    //alert("updateGBrowseTrack(): \n GeneName: " + geneName + "\n imagePath: " + imgPath + "\n picID: " + imgID);
    $.ajax({
        url : updateTrackURL,
        type : 'POST',
        data : {
            gene : geneName,
            imagePath : imgPath,
            imageID : imgID
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
