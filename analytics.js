// ===== ANALYTICS VIEW =====
import * as store from '../data/store.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let charts = [];

export function renderAnalytics(container) {
    // Destroy previous charts
    charts.forEach(c => c.destroy());
    charts = [];

    const rooms = store.getRooms();
    const analytics = store.getAnalytics(30);
    const analytics7 = store.getAnalytics(7);

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Analytics & Insights</h2>
        <p style="color:var(--text-secondary)">Room usage patterns and booking trends</p>
      </div>
      <div style="display:flex;gap:var(--space-sm)">
        <select id="analytics-range" class="btn btn-secondary">
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="30" selected>Last 30 Days</option>
        </select>
        <button class="btn btn-secondary" id="btn-export"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid-stats slide-up">
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-value">${analytics.totalBookings}</div>
        <div class="stat-label">Total Bookings</div>
        <div class="stat-change positive"><i class="fas fa-arrow-up"></i> +12% vs last period</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-user-check"></i></div>
        <div class="stat-value">${analytics.checkedInRate}%</div>
        <div class="stat-label">Check-in Rate</div>
        <div class="stat-change ${analytics.checkedInRate >= 70 ? 'positive' : 'negative'}">
          <i class="fas fa-${analytics.checkedInRate >= 70 ? 'arrow-up' : 'arrow-down'}"></i> ${analytics.checkedInRate >= 70 ? 'Good' : 'Needs Improvement'}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon teal"><i class="fas fa-clock"></i></div>
        <div class="stat-value">${analytics.avgDuration}<span style="font-size:var(--fs-sm)">min</span></div>
        <div class="stat-label">Avg. Meeting Duration</div>
        <div class="stat-change"><i class="fas fa-minus"></i> Steady</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-users"></i></div>
        <div class="stat-value">${analytics.avgAttendees}</div>
        <div class="stat-label">Avg. Attendees</div>
        <div class="stat-change positive"><i class="fas fa-arrow-up"></i> Active</div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-2" style="margin-top:var(--space-xl)">
      <div class="card slide-up" style="animation-delay:0.1s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-line" style="color:var(--brand-orange);margin-right:8px"></i>Booking Trends</h3>
        </div>
        <div class="chart-container">
          <canvas id="chart-trends"></canvas>
        </div>
      </div>
      <div class="card slide-up" style="animation-delay:0.2s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-bar" style="color:var(--brand-teal);margin-right:8px"></i>Room Utilization</h3>
        </div>
        <div class="chart-container">
          <canvas id="chart-utilization"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid-2" style="margin-top:var(--space-lg)">
      <div class="card slide-up" style="animation-delay:0.3s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-fire" style="color:var(--color-warning);margin-right:8px"></i>Peak Hours</h3>
        </div>
        <div class="chart-container">
          <canvas id="chart-peak"></canvas>
        </div>
      </div>
      <div class="card slide-up" style="animation-delay:0.4s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-trophy" style="color:var(--color-warning);margin-right:8px"></i>Top Booked Rooms</h3>
        </div>
        <div class="chart-container">
          <canvas id="chart-top-rooms"></canvas>
        </div>
      </div>
    </div>

    <!-- Summary Table -->
    <div class="card slide-up" style="margin-top:var(--space-lg);animation-delay:0.5s">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-table" style="color:var(--color-info);margin-right:8px"></i>Room Usage Summary</h3>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Bookings</th>
              <th>Total Hours</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(analytics.roomUsage).map(([id, data]) => {
        const totalHours = (data.totalMinutes / 60).toFixed(1);
        const maxHours = 30 * 12; // 30 days, 12 working hours
        const utilPct = Math.min(Math.round((data.totalMinutes / (maxHours * 60)) * 100), 100);
        return `
                <tr>
                  <td><strong>${data.name}</strong></td>
                  <td>${data.count}</td>
                  <td>${totalHours}h</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="flex:1;max-width:120px"><div class="progress-fill" style="width:${utilPct}%"></div></div>
                      <span style="font-size:var(--fs-xs);color:var(--text-secondary)">${utilPct}%</span>
                    </div>
                  </td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

    // Render Charts
    setTimeout(() => {
        renderTrendsChart(analytics);
        renderUtilizationChart(analytics);
        renderPeakChart(analytics);
        renderTopRoomsChart(analytics);
    }, 100);

    // Date range change
    container.querySelector('#analytics-range')?.addEventListener('change', e => {
        renderAnalytics(container);
    });

    // Export
    container.querySelector('#btn-export')?.addEventListener('click', () => {
        const csvRows = ['Room,Bookings,Total Minutes'];
        Object.entries(analytics.roomUsage).forEach(([id, d]) => {
            csvRows.push(`"${d.name}",${d.count},${d.totalMinutes}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'room-analytics.csv'; a.click();
        URL.revokeObjectURL(url);
        import('../components/toast.js').then(m => m.showToast('Report exported!', 'success'));
    });

    updatePageTitle('Analytics', 'Room usage patterns and insights');
}

function renderTrendsChart(analytics) {
    const ctx = document.getElementById('chart-trends');
    if (!ctx) return;
    const labels = Object.keys(analytics.dailyCounts).map(d => {
        const dt = new Date(d);
        return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    const data = Object.values(analytics.dailyCounts);
    charts.push(new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Bookings',
                data,
                borderColor: '#E8652D',
                backgroundColor: 'rgba(232, 101, 45, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#E8652D',
            }]
        },
        options: chartOptions('Bookings per Day')
    }));
}

function renderUtilizationChart(analytics) {
    const ctx = document.getElementById('chart-utilization');
    if (!ctx) return;
    const roomData = Object.values(analytics.roomUsage).filter(r => r.count > 0);
    charts.push(new Chart(ctx, {
        type: 'bar',
        data: {
            labels: roomData.map(r => r.name.length > 18 ? r.name.substring(0, 18) + '...' : r.name),
            datasets: [{
                label: 'Hours Used',
                data: roomData.map(r => (r.totalMinutes / 60).toFixed(1)),
                backgroundColor: [
                    'rgba(232, 101, 45, 0.7)',
                    'rgba(0, 184, 169, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(251, 191, 36, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderRadius: 8,
                barThickness: 28,
            }]
        },
        options: chartOptions('Hours Used')
    }));
}

function renderPeakChart(analytics) {
    const ctx = document.getElementById('chart-peak');
    if (!ctx) return;
    const labels = analytics.hourCounts.map((_, i) => `${i}:00`).slice(8, 21);
    const data = analytics.hourCounts.slice(8, 21);
    charts.push(new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Bookings',
                data,
                backgroundColor: data.map((v, i) => {
                    const max = Math.max(...data);
                    const ratio = v / Math.max(max, 1);
                    return `rgba(0, 184, 169, ${0.2 + ratio * 0.7})`;
                }),
                borderRadius: 6,
                barThickness: 20,
            }]
        },
        options: chartOptions('Meeting Frequency')
    }));
}

function renderTopRoomsChart(analytics) {
    const ctx = document.getElementById('chart-top-rooms');
    if (!ctx) return;
    const topRooms = analytics.topRooms.slice(0, 5);
    charts.push(new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topRooms.map(r => r.name.length > 20 ? r.name.substring(0, 20) + '...' : r.name),
            datasets: [{
                data: topRooms.map(r => r.count),
                backgroundColor: [
                    'rgba(232, 101, 45, 0.8)',
                    'rgba(0, 184, 169, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: '#0B0F19',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94A3C4', padding: 16, font: { family: 'Inter', size: 11 } }
                }
            },
            cutout: '65%',
        }
    }));
}

function chartOptions(yLabel = '') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                ticks: { color: '#5B6B8D', font: { family: 'Inter', size: 10 } },
                grid: { color: 'rgba(148,163,196,0.06)' },
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#5B6B8D', font: { family: 'Inter', size: 10 } },
                grid: { color: 'rgba(148,163,196,0.06)' },
                title: { display: !!yLabel, text: yLabel, color: '#5B6B8D', font: { family: 'Inter', size: 11 } },
            }
        }
    };
}

function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
