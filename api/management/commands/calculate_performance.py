from django.core.management.base import BaseCommand
from api.models import MatchRecord
from api.services import update_league_performance

class Command(BaseCommand):
    help = 'Menghitung ulang performa AI untuk semua data yang sudah ada di database'

    def handle(self, *args, **kwargs):
        self.stdout.write("Memulai kalkulasi performa AI untuk data historis...")
        
        leagues = MatchRecord.objects.values_list('league__name', flat=True).distinct()
        
        if not leagues:
            self.stdout.write(self.style.WARNING("Belum ada data pertandingan di database."))
            return

        for league_name in leagues:
            self.stdout.write(f"Memproses liga: {league_name}...")
            update_league_performance(league_name)
            self.stdout.write(self.style.SUCCESS(f"Berhasil memperbarui performa {league_name}!"))
            
        self.stdout.write(self.style.SUCCESS("Semua kalkulasi selesai! Data siap ditampilkan di website."))