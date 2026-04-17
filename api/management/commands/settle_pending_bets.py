from django.core.management.base import BaseCommand
from api.services import process_bet_settlements

class Command(BaseCommand):
    help = 'Memproses dan menyelesaikan semua taruhan pengguna yang berstatus Pending'

    def handle(self, *args, **kwargs):
        self.stdout.write("Memulai proses penyelesaian taruhan...")
        
        try:
            process_bet_settlements()
            self.stdout.write(self.style.SUCCESS("Proses penyelesaian taruhan berhasil dieksekusi!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Terjadi kesalahan: {str(e)}"))