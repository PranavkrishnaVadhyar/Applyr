const container = document.getElementById("jobs-container");

jobs.forEach(job => {

  const div = document.createElement("div");

  div.className = "job-card";

  div.innerHTML = `
<h2>${job.title}</h2>
<p><strong>Company:</strong> ${job.company}</p>
<p><strong>Location:</strong> ${job.location}</p>
<p><strong>Deadline:</strong> ${job.deadline}</p>

<a href="job.html?id=${job.id}">
<button>View Job</button>
</a>
`;

  container.appendChild(div);

});