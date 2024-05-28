document.addEventListener('DOMContentLoaded', () => {
    const processInputsDiv = document.getElementById('processInputs');
    const processesInput = document.getElementById('processes');
    const algorithmSelect = document.getElementById('algorithm');
    const quantumDiv = document.getElementById('quantumDiv');
    const resultDiv = document.getElementById('result');
    const ganttChartDiv = document.getElementById('ganttChart');
    const averagesDiv = document.getElementById('averages');

    processesInput.addEventListener('input', generateProcessInputs);
    algorithmSelect.addEventListener('change', () => {
        quantumDiv.style.display = algorithmSelect.value === 'roundRobin' ? 'block' : 'none';
    });

    document.getElementById('schedulingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const processes = getProcesses();
        const algorithm = algorithmSelect.value;
        const quantum = parseInt(document.getElementById('quantum').value);
        
        if (processes.length === 0) return;

        let { ganttChart, avgTurnaroundTime, avgWaitingTime } = scheduleProcesses(processes, algorithm, quantum);

        displayResults(ganttChart, avgTurnaroundTime, avgWaitingTime);
    });

    function generateProcessInputs() {
        const numberOfProcesses = parseInt(processesInput.value);
        processInputsDiv.innerHTML = '';

        for (let i = 0; i < numberOfProcesses; i++) {
            addProcessInput(i);
        }
    }

    function addProcessInput(index) {
        processInputsDiv.innerHTML += `
            <div class="process">
                <h3>Process ${index + 1}</h3>
                <label for="arrivalTime${index}">Arrival Time:</label>
                <input type="number" id="arrivalTime${index}" class="arrivalTime" value="0" required><br>
                <label for="burstTime${index}">Burst Time:</label>
                <input type="number" id="burstTime${index}" class="burstTime" value="1" required><br>
                <label for="priority${index}" id="priorityLabel${index}">Priority:</label>
                <input type="number" id="priority${index}" class="priority" value="1" required><br>
            </div>
        `;
    }

    function getProcesses() {
        const numberOfProcesses = processInputsDiv.children.length;
        let processes = [];

        for (let i = 0; i < numberOfProcesses; i++) {
            const arrivalTime = parseInt(document.getElementById(`arrivalTime${i}`).value);
            const burstTime = parseInt(document.getElementById(`burstTime${i}`).value);
            let priority = 1; // Default value for priority
            if (algorithmSelect.value === 'priorityNP' || algorithmSelect.value === 'priorityP') {
                priority = parseInt(document.getElementById(`priority${i}`).value);
            }
            processes.push({ id: i + 1, arrivalTime, burstTime, priority });
        }

        return processes;
    }

    function scheduleProcesses(processes, algorithm, quantum) {
        let ganttChart = [];
        let avgTurnaroundTime = 0;
        let avgWaitingTime = 0;

        switch (algorithm) {
            case 'fcfs':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = fcfs(processes));
                break;
            case 'sjf':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = sjf(processes));
                break;
            case 'srtf':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = srtf(processes));
                break;
            case 'roundRobin':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = roundRobin(processes, quantum));
                break;
            case 'priorityNP':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = priorityNonPreemptive(processes));
                break;
            case 'priorityP':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = priorityPreemptive(processes));
                break;
        }

        return { ganttChart, avgTurnaroundTime, avgWaitingTime };
    }

    function displayResults(ganttChart, avgTurnaroundTime, avgWaitingTime) {
        ganttChartDiv.innerHTML = 'Gantt Chart: ' + ganttChart.map(segment => `<span>${segment}</span>`).join('');
        averagesDiv.innerHTML = `
            <p>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}</p>
            <p>Average Waiting Time: ${avgWaitingTime.toFixed(2)}</p>
        `;
        resultDiv.style.display = 'block';
    }

    function fcfs(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
    
        processes.forEach(process => {
            if (time < process.arrivalTime) {
                ganttChart.push(`idle(${process.arrivalTime - time})`);
                time = process.arrivalTime;
            }
            ganttChart.push(`P${process.id}(${process.burstTime})`);
            time += process.burstTime;
            let waitingTime = time - process.arrivalTime - process.burstTime;
            totalTurnaroundTime += time - process.arrivalTime;
            totalWaitingTime += waitingTime >= 0 ? waitingTime : 0;
        });
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / processes.length,
            avgWaitingTime: totalWaitingTime / processes.length
        };
    }
        

    function sjf(processes) {
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let completedProcesses = 0;
        let n = processes.length;
        let isCompleted = new Array(n).fill(false);
    
        while (completedProcesses < n) {
            let idx = -1;
            let minBurstTime = Infinity;
    
            for (let i = 0; i < n; i++) {
                if (processes[i].arrivalTime <= time && !isCompleted[i] && processes[i].burstTime < minBurstTime) {
                    minBurstTime = processes[i].burstTime;
                    idx = i;
                }
            }
    
            if (idx !== -1) {
                ganttChart.push(`P${processes[idx].id}`);
                time += processes[idx].burstTime;
                let turnaroundTime = time - processes[idx].arrivalTime;
                let waitingTime = turnaroundTime - processes[idx].burstTime;
    
                totalTurnaroundTime += turnaroundTime;
                totalWaitingTime += waitingTime;
    
                isCompleted[idx] = true;
                completedProcesses++;
            } else {
                time++;
            }
        }
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / n,
            avgWaitingTime: totalWaitingTime / n
        };
    }
    
    function srtf(processes) {
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let n = processes.length;
        let remainingBurstTime = processes.map(p => p.burstTime);
        let isCompleted = new Array(n).fill(false);
        let completedProcesses = 0;
    
        while (completedProcesses < n) {
            let idx = -1;
            let minRemainingTime = Infinity;
    
            for (let i = 0; i < n; i++) {
                if (processes[i].arrivalTime <= time && !isCompleted[i] && remainingBurstTime[i] < minRemainingTime) {
                    minRemainingTime = remainingBurstTime[i];
                    idx = i;
                }
            }
    
            if (idx !== -1) {
                if (ganttChart.length === 0 || ganttChart[ganttChart.length - 1] !== `P${processes[idx].id}`) {
                    ganttChart.push(`P${processes[idx].id}`);
                }
                remainingBurstTime[idx]--;
                time++;
    
                if (remainingBurstTime[idx] === 0) {
                    isCompleted[idx] = true;
                    completedProcesses++;
                    let turnaroundTime = time - processes[idx].arrivalTime;
                    let waitingTime = turnaroundTime - processes[idx].burstTime;
    
                    totalTurnaroundTime += turnaroundTime;
                    totalWaitingTime += waitingTime;
                }
            } else {
                ganttChart.push(`idle`);
                time++;
            }
        }
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / n,
            avgWaitingTime: totalWaitingTime / n
        };
    }
    
    function roundRobin(processes, quantum) {
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let n = processes.length;
        let remainingBurstTime = processes.map(p => p.burstTime);
        let completedProcesses = 0;
        let queue = [];
        let arrivalIndex = 0;
    
        while (completedProcesses < n) {
            while (arrivalIndex < n && processes[arrivalIndex].arrivalTime <= time) {
                queue.push(arrivalIndex);
                arrivalIndex++;
            }
    
            if (queue.length > 0) {
                let idx = queue.shift();
    
                ganttChart.push(`P${processes[idx].id}`);
                let executionTime = Math.min(quantum, remainingBurstTime[idx]);
                time += executionTime;
                remainingBurstTime[idx] -= executionTime;
    
                if (remainingBurstTime[idx] === 0) {
                    completedProcesses++;
                    let turnaroundTime = time - processes[idx].arrivalTime;
                    let waitingTime = turnaroundTime - processes[idx].burstTime;
    
                    totalTurnaroundTime += turnaroundTime;
                    totalWaitingTime += waitingTime;
                } else {
                    while (arrivalIndex < n && processes[arrivalIndex].arrivalTime <= time) {
                        queue.push(arrivalIndex);
                        arrivalIndex++;
                    }
                    queue.push(idx);
                }
            } else {
                time++;
            }
        }
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / n,
            avgWaitingTime: totalWaitingTime / n
        };
    }

    function priorityNonPreemptive(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime || a.priority - b.priority);
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
    
        processes.forEach(process => {
            if (time < process.arrivalTime) {
                time = process.arrivalTime;
            }
            let waitingTime = time - process.arrivalTime;
            time += process.burstTime;
            let turnaroundTime = time - process.arrivalTime;
            ganttChart.push(`P${process.id}(${turnaroundTime})`);
    
            totalTurnaroundTime += turnaroundTime;
            totalWaitingTime += waitingTime;
    
            // Adjust time for the next process
            time = Math.max(time, process.arrivalTime + process.burstTime);
        });
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / processes.length,
            avgWaitingTime: totalWaitingTime / processes.length
        };
    }
    

    function priorityPreemptive(processes) {
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let n = processes.length;
        let remainingBurstTime = processes.map(p => p.burstTime);
        let isCompleted = new Array(n).fill(false);
        let completedProcesses = 0;
    
        while (completedProcesses < n) {
            let idx = -1;
            let highestPriority = Infinity;
    
            for (let i = 0; i < n; i++) {
                if (processes[i].arrivalTime <= time && !isCompleted[i] && processes[i].priority < highestPriority) {
                    highestPriority = processes[i].priority;
                    idx = i;
                }
            }
    
            if (idx !== -1) {
                if (ganttChart.length === 0 || ganttChart[ganttChart.length - 1] !== `P${processes[idx].id}`) {
                    ganttChart.push(`P${processes[idx].id}`);
                }
                time++;
                remainingBurstTime[idx]--;
    
                if (remainingBurstTime[idx] === 0) {
                    isCompleted[idx] = true;
                    completedProcesses++;
                    let turnaroundTime = time - processes[idx].arrivalTime;
                    let waitingTime = turnaroundTime - processes[idx].burstTime;
    
                    totalTurnaroundTime += turnaroundTime;
                    totalWaitingTime += waitingTime;
                }
            } else {
                ganttChart.push(`idle`);
                time++;
            }
        }
    
        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / n,
            avgWaitingTime: totalWaitingTime / n
        };
    }
});