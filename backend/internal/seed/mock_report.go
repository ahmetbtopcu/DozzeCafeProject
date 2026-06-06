package seed

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/models"
	"github.com/google/uuid"
)

const mockImageURL = "https://upload.wikimedia.org/wikipedia/commons/1/1c/Messi_-_culo_grande_(4759319694).jpg"

func BuildMockReport() (models.Report, error) {
	imageBase64, err := fetchMockImageBase64()
	if err != nil {
		return models.Report{}, err
	}

	lat := 41.08794
	lng := 28.990746

	return models.Report{
		ID:        uuid.New().String(),
		CreatedAt: time.Now().UTC().Add(-2 * time.Hour),
		Status:    models.ReportStatusPending,
		Lat:       lat,
		Lng:       lng,
		ImageBase64: imageBase64,
		BlurCount:   0,
		Detections: []models.Detection{
			{
				Type:       "garbage_pile",
				Label:      "Çöp / moloz",
				Confidence: 0.91,
				BBox:       []float64{0.15, 0.42, 0.72, 0.88},
			},
		},
		Severity: models.Severity{
			Score:        68,
			Level:        "high",
			PrimaryType:  "garbage_pile",
			PrimaryLabel: "Çöp / moloz",
		},
		ViolationType:     "garbage_pile",
		ViolationLabel:    "Çöp / moloz",
		UserViolationType: "garbage_pile",
		Details: "Cadde kenarında moloz ve çöp yığını birikmiş. Yaya kaldırımı daralmış, " +
			"okul çıkış saatinde çocuklar yola inmek zorunda kalıyor. 3 gündür aynı durum devam ediyor.",
		Address: models.Address{
			City:         "İstanbul",
			District:     "Kağıthane",
			Neighborhood: "Şirintepe Mahallesi",
			Avenue:       "Gümüşhane Cad.",
			Street:       "Şehit Karakuşlar Sk.",
			BuildingNo:   "101",
		},
		Reporter: models.Reporter{
			FirstName: "Ayşe",
			LastName:  "Demir",
			Name:      "Ayşe Demir",
			Email:     "ayse.demir@ornek.mail",
			Phone:     "+90 532 000 00 00",
		},
		Authority: models.Authority{
			ViolationType: "garbage_pile",
			Authority:     "İlçe Belediyesi Temizlik İşleri Müdürlüğü",
			Channel:       "CİMER / Alo 153",
			LawRef:        "2872 Çevre Kanunu, 5393 İlçe Belediyesi Kanunu",
			Reason:        "Moloz ve çöp yığını kaldırım işgali oluşturuyor.",
		},
		LegalReferences: []models.LegalRef{
			{
				Source:  "Çevre Kanunu",
				Heading: "Atık yönetimi yükümlülüğü",
				Text:    "Atıkların usulüne uygun toplanması ve taşınması zorunludur.",
				Score:   0.87,
			},
		},
		Petition: `T.C. CİMER BAŞVURUSU — Mock örnek ihbar

KONU: Çöp / moloz birikimi (Şirintepe Mahallesi)

SAYIN YETKİLİ,

İstanbul ili, Kağıthane ilçesi, Şirintepe Mahallesi, Gümüşhane Cad. / Şehit Karakuşlar Sk. No:101
civarında kaldırım kenarında moloz ve çöp yığını tespit ettim. Ekte anonimleştirilmiş fotoğraf yer almaktadır.

YETKİLİ KURUM: İlçe Belediyesi Temizlik İşleri Müdürlüğü
HUKUKİ DAYANAK: 2872 sayılı Çevre Kanunu, 5393 sayılı Belediye Kanunu

Saygılarımla,
Ayşe Demir`,
		Demo: true,
	}, nil
}

func fetchMockImageBase64() (string, error) {
	req, err := http.NewRequest(http.MethodGet, mockImageURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "NobetciBackend/1.0 (hackathon mock seed)")

	client := &http.Client{Timeout: 30 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("mock image fetch: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("mock image fetch: status %d", res.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	if err != nil {
		return "", fmt.Errorf("mock image read: %w", err)
	}

	return base64.StdEncoding.EncodeToString(body), nil
}
