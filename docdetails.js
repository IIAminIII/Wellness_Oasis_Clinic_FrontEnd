const getparams = () => {
  const param = new URLSearchParams(window.location.search).get("doctorId");
  loadTime(param);
  fetch(`https://wellness-oasis-clinic-api.onrender.com/doctors/list/${param}`)
    .then((res) => res.json())
    .then((data) => {
      displayDetails(data);
    });

  fetch(
    `https://wellness-oasis-clinic-api.onrender.com/doctors/reviews/?doctor_id=${param}`
  )
    .then((res) => res.json())
    .then((data) => doctorReview(data));
};

const doctorReview = (reviews) => {
  reviews.forEach((review) => {
    const parent = document.getElementById("doc-details-review");
    const div = document.createElement("div");
    div.classList = "border w-[150px] px-3 py-1 rounded-md min-h-40";
    div.innerHTML = `
    <h4 class="text-lg font-semibold">${review.reviewer}</h4>
    <h6 class="text-[#42A9D0]">${review.rating}</h6>
        <p class="text-sm pt-2">
         ${review.body.slice(0, 100)}
        </p>
            `;
    parent.appendChild(div);
  });
};
const displayDetails = (doctor) => {
  const parent = document.getElementById("doc-details");
  const div = document.createElement("div");
  div.classList =
    "flex flex-row items-center justify-center gap-10 border w-fit mx-auto rounded-md px-8 py-3";

  div.innerHTML = `
    <div>
    <img class="rounded-full w-[210px] h-[210px] border" src=${
      doctor.image
    } alt="" />
  </div>
  <div class=""> 
    <h1 class="text-2xl font-semibold text-[#42A9D0]">${doctor.user} </h1>
     <div class="flex flex-row items-center justify-start my-2 gap-1">
            ${doctor.specialization?.map((item) => {
              return `<p class="bg-gray-300 px-[2px] py-[1px] text-sm rounded-md">${item}</p>`;
            })}
             ${doctor.designation?.map((item) => {
               return `<p class="bg-gray-300 px-[2px] py-[1px] text-sm rounded-md">${item}</p>`;
             })}
     </div>
    <p class="max-w-[350px] text-sm my-2">
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Et quibusdam
        quis excepturi tempore. Eius, qui!
    </p>

    <h4>Fees: <span class="text-[#ff0000] mb-2"> ${doctor.fee}</span> BDT</h4>
  
   
   <button
    type="button"
    class="btn bg-[#42A9D0] hover:bg-cyan-500 text-white mt-2"
    data-bs-toggle="modal"
    data-bs-target="#exampleModal"
    >
    Take Appointment
    </button>
  </div>
    `;
  parent.appendChild(div);
};

const loadTime = (id) => {
  fetch(
    `https://wellness-oasis-clinic-api.onrender.com/doctors/availableTime/?doctor_id = ${id}`
  )
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        const parent = document.getElementById("time-container");
        const option = document.createElement("option");
        option.value = item.id;
        option.innerText = item.name;
        parent.appendChild(option);
      });
    });
};

const loadPatientId = () => {
  const user_id = localStorage.getItem("user_id");
  fetch(
    `https://wellness-oasis-clinic-api.onrender.com/patients/list/?user_id=${user_id}`
  )
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("patient_id", data[0].id);
    });
};

const handleAppointment = () => {
  const param = new URLSearchParams(window.location.search).get("doctorId");
  const status = document.getElementsByName("status");
  const selected = Array.from(status).find((button) => button.checked);
  const symptom = document.getElementById("symptom").value;
  const time = document.getElementById("time-container");
  const selectedTime = time.options[time.selectedIndex];
  const patient_id = localStorage.getItem("patient_id");
  const info = {
    appointment_type: selected.value,
    appointment_status: "Pending",
    time: selectedTime.value,
    symptom: symptom,
    cancel: false,
    patient: patient_id,
    doctor: param,
  };
  console.log(info);
  fetch("https://wellness-oasis-clinic-api.onrender.com/appointments/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(info),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    });
};

getparams();
loadTime();
loadPatientId();
