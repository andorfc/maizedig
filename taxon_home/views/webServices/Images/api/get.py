"""
    GetAPI for Images
    @methods
      getImageMetadata(imageKey, isKey=True)
        return metadata
    @fields
      fields
      user

    Updated by Kyoung Tak Cho
    Last Updated: Jan 12 22:22:50 CDT 2019
"""
import taxon_home.views.util.ErrorConstants as Errors
from taxon_home.models import Picture, PictureDefinitionTag, RecentlyViewedPicture
from taxon_home.models import PictureMgdb, PictureGeneID
from django.core.exceptions import ObjectDoesNotExist
from renderEngine.WebServiceObject import WebServiceObject
from taxon_home.views.webServices.Notes.api.get import GetAPI as NotesAPI
from taxon_home.views.webServices.Qtls.api.get import GetAPI as QtlAPI

class GetAPI:
    def __init__(self, user=None, fields=None):
        self.user = user
        self.fields = fields

    '''
        Gets the metadata associated with an image given the image key
        
        @param imageKey: The primary key for the image or the image
        @param isKey: Whether the first argument is a key object or not (default: true)
        
        @return: A dictionary containing organisms associated with the image and all 
        of the images attributes. The dictionary will also contain error information
        stored in the errorMessage and error fields
    '''
    def getImageMetadata(self, imageKey, isKey=True):
        # TODO: getImageMetadata() should be refactorized because it is used for all image loading parts
        #  including image list even thumbnail image. It potentially has unnecessary database queries.

        organisms = []
        geneIDs = []
        metadata = WebServiceObject()
        
        try:
            if (isKey):
                image = Picture.objects.get(pk__exact=imageKey) 
            else:
                image = imageKey
        except (ObjectDoesNotExist, ValueError):
            raise Errors.INVALID_IMAGE_KEY

        # Get gene information
        geneSymbol = None
        geneName = None
        if image is not None:
            # Gene ID
            pictureGIDs = PictureGeneID.objects.filter(picture__exact=image)
            for picGID in pictureGIDs:
                geneIDs.append({
                    'geneID' : picGID.gene_id,
                    'version' : picGID.version
                })

            pictureMbs = PictureMgdb.objects.filter(picture__exact=image)
            for pMb in pictureMbs:
                geneSymbol = pMb.locus_name
                geneName = pMb.locus_full_name
                break

        if not image.readPermissions(self.user):
            raise Errors.AUTHENTICATION
        
        if not self.fields or 'organisms' in self.fields:
            defTags = PictureDefinitionTag.objects.filter(picture__exact=image)
            
            for tag in defTags:
                organisms.append({
                    'commonName' : tag.organism.common_name,
                    'abbreviation' : tag.organism.abbreviation,
                    'genus' : tag.organism.genus,
                    'species' : tag.organism.species,
                    'id' : tag.organism.pk
                })

        # Get all imageID for imageName
        images = Picture.objects.filter(imageName__exact=image.imageName)

        # Get Image Notes Information
        notes_id = ''
        notes = ''
        notesBy = ''

        pictureNotesAPI = NotesAPI(self.user)
        for imageID in images:
            pictureNotes = pictureNotesAPI.getNote(imageID).getObject()
            if pictureNotes:
                notes_id = pictureNotes['pn_id']
                notes = pictureNotes['notes']
                notesBy = pictureNotes['user']
                break

        # Get QTL information
        qtls_id = ''
        qtl = ''
        pictureQtlAPI = QtlAPI(self.user)
        for imageID in images:
            pictureQtl = pictureQtlAPI.getQtl(imageID).getObject()
            if pictureQtl:
                qtls_id = pictureQtl['pq_id']
                qtl = pictureQtl['qtl']
                break

        metadata.limitFields(self.fields)

        # put in the information we care about
        metadata.put('organisms', organisms)
        metadata.put('description', image.description)
        metadata.put('altText', image.altText)
        metadata.put('uploadedBy', image.user.username)
        metadata.put('uploadDate', image.uploadDate.strftime("%Y-%m-%d %H:%M:%S"))
        metadata.put('url', image.imageName.url)
        metadata.put('thumbnail', image.thumbnail.url)
        metadata.put('id', image.pk)
        metadata.put('geneIDs', geneIDs)
        metadata.put('geneSymbol', geneSymbol)
        metadata.put('geneName', geneName)
        metadata.put('notes_id', notes_id)
        metadata.put('notes', notes)
        metadata.put('notesBy', notesBy)
        metadata.put('qtls_id', qtls_id)
        metadata.put('qtl', qtl)

        return metadata
