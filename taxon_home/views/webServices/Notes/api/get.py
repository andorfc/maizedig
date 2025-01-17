'''
	GetAPI for handling Image Notes data

	Author: Kyoung Tak Cho
	Date: Oct. 23, 2017
    Last Updated: Jan 10 12:16:54 CDT 2019
'''

import taxon_home.views.util.ErrorConstants as Errors
from taxon_home.models import PictureNotes
from django.core.exceptions import ObjectDoesNotExist
from renderEngine.WebServiceObject import WebServiceObject

class GetAPI:

    def __init__(self, user=None, fields=None):
        self.user = user
        self.fields = fields

    '''
        Gets all the tags in the database that are private
    '''
    def getNote(self, imageKey):
        metadata = WebServiceObject()

        try:
            pictureNotes = PictureNotes.objects.filter(picture__exact=imageKey).order_by('-dateCreated')[:1].get()
        except (ObjectDoesNotExist, ValueError):
            return metadata
        #except Exception:
        #    raise Errors.INTERNAL_ERROR

        metadata.limitFields(self.fields)

        metadata.put('pn_id', pictureNotes.pk)
        metadata.put('picture', pictureNotes.picture.pk)
        metadata.put('notes', pictureNotes.notes)
        metadata.put('user', pictureNotes.user.username)
        metadata.put('dateCreated', pictureNotes.dateCreated.strftime("%Y-%m-%d %H:%M:%S"))

        return metadata
