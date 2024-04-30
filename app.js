const loadServices = () => {
  fetch("https://wellness-oasis-clinic-api.onrender.com/services/")
    .then((res) => res.json())
    .then((data) => displayService(data))
    .catch((err) => console.log(err));
};

const displayService = (services) => {
  const doctorPerPages = 6;
  let displayedDoctors = services.slice(0, doctorPerPages);
  if (!services || services.length === 0) {
    // Handle no data scenario (show an error message, hide the container, etc.)
    console.error("No services found!");
    return;
  }

  displayedDoctors.forEach((service) => {
    const parent = document.getElementById("service-container");
    const li = document.createElement("li");
    li.classList = "flex flex-col max-w-[260px] mx-auto border bg-gray-50 rounded-md p-3 space-y-3";
    li.innerHTML = `
              <img class="w-[260px] rounded-md h-40" src=${service?.image} alt="">
              <h3>${service?.name}</h3>
              <p class="text-xs">${service?.description.slice(0, 100)}.</p>
              <button class=" text-[#42A9D0] href="services.html">Learn more... </button>
      `;
    parent.appendChild(li);
  });
};

const loadDoctors = (search) => {
  document.getElementById("doctors").innerHTML = "";
  fetch(
    `https://wellness-oasis-clinic-api.onrender.com/doctors/list/?search=${
      search ? search : ""
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      displayDoctors(data);
    });
};
const displayDoctors = (doctors) => {
  doctors?.forEach((doctor) => {
    const parent = document.getElementById("doctors");
    const div = document.createElement("div");
    div.classList.add("doc-card");
    div.classList = "border rounded-md";
    div.innerHTML = `
        <img class="doc-img rounded-t-md" src=${doctor.image} alt="" />
            <div class="px-2 py-1 flex flex-col items-start justify-start space-y-2">
            <h4 class="font-semibold text-lg mt-4">${doctor?.user}</h4>
            <div class="flex flex-row items-start justify-start gap-1">
            <p class="bg-gray-300 px-[3px] py-[2px] text-xs w-fit rounded">
            ${doctor?.designation[0]}
            </p>
            <p class="bg-gray-300 px-[3px] py-[2px] text-xs w-fit rounded">
            
            ${doctor?.specialization?.map((item) => {
              return `<button>${item}</button>`;
            })}
            </p>
            </div>
            <p class="text-xs pb-5">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis,
              numquam!
            </p>
           
            

            <button class="bg-[#42A9D0] px-[5px] py-[3px] text-white rounded-md"> <a target="_blank" href="docdetails.html?doctorId=${
              doctor.id
            }">Details</a> </button>
            </div>
        `;

    parent.appendChild(div);
  });
};

const loadDesignation = () => {
  fetch("https://wellness-oasis-clinic-api.onrender.com/doctors/designation/")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        const parent = document.getElementById("designation");
        const li = document.createElement("li");
        li.classList.add("dropdown-item");
        li.innerText = item?.name;
        parent.appendChild(li);
      });
    });
};

const loadSpecialization = () => {
  fetch(
    "https://wellness-oasis-clinic-api.onrender.com/doctors/specialization/"
  )
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        const parent = document.getElementById("specialist");
        const li = document.createElement("li");
        li.classList.add("dropdown-item");
        li.innerHTML = `
        <li class="hover:bg-[#42A9D0] hover:px-[3px] hover:text-white hover:cursor-pointer rounded-md transition-colors duration-150" onclick="loadDoctors('${item.name}')"> ${item.name}</li>
          `;
        parent.appendChild(li);
      });
    });
};

const loadReview = () => {
  fetch("https://wellness-oasis-clinic-api.onrender.com/doctors/reviews/")
    .then((res) => res.json())
    .then((data) => displayReview(data));
};

const displayReview = (reviews) => {
  reviews.forEach((review) => {
    const parent = document.getElementById("review-container");
    const div = document.createElement("div");
    div.classList.add("review-card");
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


loadServices();
loadDoctors();
loadDesignation();
loadSpecialization();
loadReview();
