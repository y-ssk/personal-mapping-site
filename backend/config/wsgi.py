"""
Personal Mapping SiteのWSGI設定。

WSGIアプリケーションを``application``というモジュールレベル変数として公開する。
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_wsgi_application()
