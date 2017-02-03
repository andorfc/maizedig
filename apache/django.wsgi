import os
import sys

#path = '/var/www/MaizeDIG'
path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
#otherpath = '/var/www'
otherpath = os.path.dirname(path)

# Set Project Name with current directory name
projectName = path.split(os.sep)[-1]

sys.path.append(path)
sys.path.append(otherpath)

#os.environ['DJANGO_SETTINGS_MODULE'] = 'MaizeDIG.settings'
os.environ['DJANGO_SETTINGS_MODULE'] =  projectName + ".settings"

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()

