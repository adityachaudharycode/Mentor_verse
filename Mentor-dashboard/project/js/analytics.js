// Analytics functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize charts if Chart.js is loaded
  if (window.Chart) {
    initializeAnalyticsCharts();
  }
  
  // Period filter buttons
  const periodButtons = document.querySelectorAll('.period-btn');
  
  if (periodButtons.length) {
    periodButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active state
        periodButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const period = button.getAttribute('data-period');
        
        // In a real app, this would update the charts with new data
        updateChartsForPeriod(period);
      });
    });
  }
  
  // Handle achievement animations
  const achievements = document.querySelectorAll('.achievement-item');
  
  achievements.forEach(achievement => {
    // Animate progress bars when they enter viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const progressBar = achievement.querySelector('.progress');
          if (progressBar) {
            const width = progressBar.style.width;
            progressBar.style.width = '0%';
            
            setTimeout(() => {
              progressBar.style.transition = 'width 1s ease-in-out';
              progressBar.style.width = width;
            }, 200);
          }
          
          observer.unobserve(achievement);
        }
      });
    });
    
    observer.observe(achievement);
  });
});

// Initialize analytics charts
function initializeAnalyticsCharts() {
  // Sessions chart
  const sessionsChartEl = document.getElementById('sessionsChart');
  
  if (sessionsChartEl) {
    const sessionsChart = new Chart(sessionsChartEl, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Completed',
            data: [5, 8, 7, 9],
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Scheduled',
            data: [7, 10, 12, 8],
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  
  // Topics chart
  const topicsChartEl = document.getElementById('topicsChart');
  
  if (topicsChartEl) {
    const topicsChart = new Chart(topicsChartEl, {
      type: 'doughnut',
      data: {
        labels: ['AI/ML', 'Web Dev', 'Data Science', 'Career Guidance', 'System Design'],
        datasets: [
          {
            data: [30, 25, 15, 20, 10],
            backgroundColor: [
              'rgba(79, 70, 229, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

// Update charts based on selected period
function updateChartsForPeriod(period) {
  // This would fetch new data based on the selected period
  // For demo purposes, we'll just log the selected period
  console.log(`Updating charts for period: ${period}`);
  
  // In a real application, we would update the chart data
  // Example:
  // sessionsChart.data.labels = newLabels;
  // sessionsChart.data.datasets[0].data = newCompletedData;
  // sessionsChart.data.datasets[1].data = newScheduledData;
  // sessionsChart.update();
  
  // For demo, we'll just simulate chart data updates
  const sessionsChartEl = document.getElementById('sessionsChart');
  const topicsChartEl = document.getElementById('topicsChart');
  
  if (sessionsChartEl && window.Chart) {
    const chart = Chart.getChart(sessionsChartEl);
    
    if (chart) {
      let newLabels = [];
      let completedData = [];
      let scheduledData = [];
      
      switch (period) {
        case 'week':
          newLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          completedData = [2, 3, 1, 4, 2, 0, 1];
          scheduledData = [3, 4, 2, 5, 3, 0, 2];
          break;
        case 'month':
          newLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          completedData = [5, 8, 7, 9];
          scheduledData = [7, 10, 12, 8];
          break;
        case 'quarter':
          newLabels = ['January', 'February', 'March'];
          completedData = [20, 25, 28];
          scheduledData = [25, 30, 32];
          break;
        case 'year':
          newLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
          completedData = [70, 85, 65, 80];
          scheduledData = [80, 95, 75, 90];
          break;
      }
      
      chart.data.labels = newLabels;
      chart.data.datasets[0].data = completedData;
      chart.data.datasets[1].data = scheduledData;
      chart.update();
    }
  }
  
  if (topicsChartEl && window.Chart) {
    const chart = Chart.getChart(topicsChartEl);
    
    if (chart) {
      let newData = [];
      
      switch (period) {
        case 'week':
          newData = [35, 20, 15, 20, 10];
          break;
        case 'month':
          newData = [30, 25, 15, 20, 10];
          break;
        case 'quarter':
          newData = [25, 30, 20, 15, 10];
          break;
        case 'year':
          newData = [20, 25, 25, 15, 15];
          break;
      }
      
      chart.data.datasets[0].data = newData;
      chart.update();
    }
  }
}