package store

import (
	"sync"

	"github.com/ahmetbtopcu/gungoren-proje/backend/internal/models"
)

type MemoryStore struct {
	mu      sync.RWMutex
	reports []models.Report
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{reports: make([]models.Report, 0)}
}

func (s *MemoryStore) Add(r models.Report) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.reports = append(s.reports, r)
}

func (s *MemoryStore) List() []models.Report {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Report, len(s.reports))
	copy(out, s.reports)
	return out
}

func (s *MemoryStore) Stats() models.Stats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats := models.Stats{
		TotalReports:    len(s.reports),
		ByViolationType: map[string]int{},
		BySeverityLevel: map[string]int{},
	}
	var sum int
	for _, r := range s.reports {
		stats.ByViolationType[r.ViolationType]++
		stats.BySeverityLevel[r.Severity.Level]++
		sum += r.Severity.Score
	}
	if len(s.reports) > 0 {
		stats.AvgSeverity = float64(sum) / float64(len(s.reports))
	}
	return stats
}

func (s *MemoryStore) MapPins() []models.MapPin {
	s.mu.RLock()
	defer s.mu.RUnlock()
	pins := make([]models.MapPin, 0, len(s.reports))
	for _, r := range s.reports {
		pins = append(pins, models.MapPin{
			ID:             r.ID,
			Lat:            r.Lat,
			Lng:            r.Lng,
			SeverityScore:  r.Severity.Score,
			SeverityLevel:  r.Severity.Level,
			ViolationType:  r.ViolationType,
			ViolationLabel: r.ViolationLabel,
		})
	}
	return pins
}
