'''
    Application for the Images Page of the DOME
    URL: /images

    Author: Andrew Oberlin
    Date: July 23, 2012

    Updated by Kyoung Tak Cho
    Last Updated: Jul 12 02:02:52 CDT 2017
'''
from taxon_home.models import Picture
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.core.servers.basehttp import FileWrapper
from django.core.exceptions import ObjectDoesNotExist
import os

'''
    Adds a prefix check on user permissions before serving media files
'''
def renderAction(request, *args, **kwargs):
    authorized = False
    query = request.path_info.split('media/')[1]
    filename = os.path.join(settings.MEDIA_ROOT, query)
    # check for thumbnail
    thumbnailCheck = query.split('thumbnails/')
    if len(thumbnailCheck) > 1:
        query = os.path.join('pictures', thumbnailCheck[1])

    try:
        picture = Picture.objects.get(imageName=query)
    except Picture.DoesNotExist:
        try:
            picture = Picture.objects.get(thumbnail=query)
        except Picture.DoesNotExist:
            print 'Cannot find an image on picture table with both imageName and thumbnail'    # for debugger
            return HttpResponseNotFound()
        except Picture.MultipleObjectsReturned:
            pictures = list(Picture.objects.filter(thumbnail=query))
            picture = pictures[0]
    except Picture.MultipleObjectsReturned:
        pictures = list(Picture.objects.filter(imageName=query))
        picture = pictures[0]

    if request.user and request.user.is_authenticated():
        if request.user.is_staff:
            authorized = True
        else:
            authorized = picture.readPermissions(request.user)
    else:
        try:
            authorized = not picture.isPrivate
        except Exception:
            print 'Cannot find an image on picture table with both imageName and thumbnail'    # for debugger
            return HttpResponseNotFound()

    if authorized:
        try:
            response = HttpResponse(FileWrapper(file(filename)), mimetype="image/png")
            response['Content-Length'] = os.path.getsize(filename)
            return response
        except Exception:
            print 'HttpResponse exception!'
            return HttpResponseNotFound()
    else:
        print 'Not authorized!'
        return HttpResponseNotFound()

