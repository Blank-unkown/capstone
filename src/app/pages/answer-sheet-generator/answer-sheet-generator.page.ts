import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocalDataService, TopicEntry } from '../../services/local-data.service';
import { ActivatedRoute } from '@angular/router';
import { Input } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastController, LoadingController } from '@ionic/angular';


@Component({
  selector: 'app-answer-sheet-generator',
  templateUrl: './answer-sheet-generator.page.html',
  styleUrls: ['./answer-sheet-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnswerSheetGeneratorPage implements OnInit {
  @Input() classId!: number;
  @Input() subjectId!: number;

  tos: TopicEntry[] = [];
  totalQuestions = 0;
  className = '';
  subjectName = '';

  constructor(private route: ActivatedRoute,
  private toastController: ToastController,
  private loadingController: LoadingController) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('classId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    const cls = LocalDataService.getClass(this.classId);
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);

    this.className = cls?.name || '';
    this.subjectName = subject?.name || '';
    this.tos = subject?.tos || [];

    this.totalQuestions = this.tos.reduce((sum, topic) => sum + Number(topic.expectedItems || 0), 0);
  }

  getX(index: number): number {
    const group = Math.floor(index / 10);
    const colWidth = 200;
    const col = group % 3;
    return 120 + col * colWidth;
  }

  getY(index: number): number {
  const group = Math.floor(index / 10);
  const row = index % 10;
  const rowHeight = 30; // tighter rows
  return group < 3 ? 185 + row * rowHeight : 505 + row * rowHeight;
}


async exportPDF() {   
  const element = document.getElementById('answer-sheet-container');
  if (!element) {
    alert('Answer sheet not found.');
    return;
  }

  const loading = await this.loadingController.create({
    message: 'Generating PDF...',
    spinner: 'dots',
  });
  await loading.present();

  try {
    const canvas = await html2canvas(element, {
  backgroundColor: '#ffffff',
  scale: 2 // Lower scale for cleaner print
});

const imgData = canvas.toDataURL('image/png');
const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4' // Make it compatible with real printers
});

const imgProps = pdf.getImageProperties(imgData);
const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);


    const fileName = `answer-sheet-${Date.now()}.pdf`;

    // 📱 Mobile (Capacitor)
    if (Capacitor.getPlatform() !== 'web') {
      const pdfBlob = pdf.output('blob');
      const base64Data = await this.blobToBase64(pdfBlob);

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      await loading.dismiss();

      await Share.share({
        title: 'Exported Answer Sheet',
        text: 'Here is the answer sheet PDF.',
        url: saved.uri,
        dialogTitle: 'Share PDF',
      });

      this.showToast('✅ PDF saved and ready to share!');
    }

    // 💻 Browser fallback
    else {
      const blobUrl = pdf.output('bloburl').toString();
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await loading.dismiss();
      this.showToast('✅ PDF downloaded!');
    }
  } catch (error) {
    console.error('Export error:', error);
    await loading.dismiss();
    this.showToast('❌ Failed to export or share PDF.');
  }
}



  private blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
private async showToast(message: string) {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
    color: 'dark'
  });
  await toast.present();
}

}
