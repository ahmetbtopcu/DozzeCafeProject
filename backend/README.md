# backend/ — Go (Golang)

> ⚠️ **GEÇİCİ PLACEHOLDER.** Resmî `masterfabric-go` mimarisi etkinlik başında
> (11:00) teslim edilecek. O mimari geldiğinde bu klasörün içeriği onunla
> değiştirilecek ve yapıya **birebir** sadık kalınacaktır. Aşağıdaki `main.go`
> yalnızca "backend ayakta mı" testini ve Render deploy iskeletini kurmak içindir.

## Çalıştırma (Go kurulduktan sonra)
```bash
cd backend
go run ./cmd/api
# http://localhost:8080/health
```

## Render.com notları
- Servis `PORT` ortam değişkenini okur (Render bunu otomatik atar).
- Build: `go build -o bin/api ./cmd/api`
- Start: `./bin/api`

## masterfabric-go geldiğinde
1. Bu placeholder'ı sil/taşı.
2. Resmî repo mimarisini buraya yerleştir.
3. `go.mod` module adını ve katman yapısını koru.
4. Commit: `feat(backend): masterfabric-go mimarisi entegre edildi`
