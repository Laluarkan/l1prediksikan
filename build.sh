#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Membuat superuser secara otomatis dari Environment Variables (mode non-interaktif)
# || true digunakan agar build tidak gagal jika user admin sudah pernah dibuat sebelumnya
python manage.py createsuperuser --noinput || true