let page;
let option = ""
let note= ""
let minmumOrder;
let closeOrder;
$(function () {
  $(document).ready(function () {
    $("#example").DataTable();
    try {
      document.getElementById("tbody").addEventListener("click", (e) => {
        const fullID = e.path[0].id;
        const arr = fullID.split("-");
        const id = arr[1];
        inputOrder(id);
      });
    } catch (err) {
      console.log(err);
    }
    $("#submitOrder").on("click", () => {
      showModal('notes')
    });
    $(".closeAdd_btu").on("click", () => {
      hideModal("notes");
    });
    $(".add_btu").on("click", () => {
      hideModal("notes");
      let text = document.getElementById('textArea').value
      if(text == ""){
        note = "لايوجد"
      }else{
        note = text
      }
      document.getElementById('textArea').value = ""
      tryToSubmit();
    });
    $("#report").on("click", (e) => {
      const txt = $("#report p")[0].innerHTML.trim();
      if (txt == "Report") {
        showReport();
      } else {
        showAllReports();
      }
    });
    $(".netError_denied").on("click", () => {
      hideModal("net-error");
    });
    $(".netError_accept").on("click", () => {
      hideModal("net-error");
      tryToSubmit();
    });
  });
  $("#exit").on("click", (e) => {
    const txt = $("#exit p")[0].innerHTML.trim();
    if (txt == "Exit") {
      showTransaction();
    } else {
      logOut();
    }
  });
  // $("#select-0").on("click", () => {
  //   selectFrom('#select-0')
  // });
  $("#suggestion").on("click", (e) => {
    const txt = $("#suggestion p")[0].innerHTML.trim();
    if (txt == "Suggestion") {
      showModal('waiting')
      createSuggest();
    } else {
      showModal('waiting')
      undoSuggest();
    }
  });
});

const edit = (id) => {
  const tr = $(`#tr${id}`);
  tr.removeClass("active-input");
  tr.removeClass("semi-active");
  tr.addClass("hide");
  tr.css("background-color", "");
};

const save = (id, input, previousVal,lastValue) => {
  const tr = $(`#tr${id}`);
  let value = input.val();
  if((lastValue == value) && (value != "")){
    tr.addClass("active-input");
    tr.removeClass("hide");
    tr.css("background-color", "green");
  }else if (value == "") {
    if (previousVal) {
      setOrderValueZero(id);
    }
    input.val("");
  } else if (value.toString()[0] == "-") {
    if (previousVal) {
      setOrderValueZero(id);
    }
    input.val("");
    alert("ينبغي تحديد كمية الطلب قبل الحفظ");
  } else {
    value = trim(value);
    const checked = check(value, id);
    if (checked) {
      if (value != 0) {
        const multi = checkMulti(value, id);
        if (multi) {
          $.post(`/Order/Save/${id}/${value}`).then((msg) => {
            if (msg == "error") {
              alert(
                "IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم"
              );
              input.val("");
            } else {
              if (page == "request") {
                tr.addClass("active-input");
                tr.removeClass("hide");
                tr.css("background-color", "green");
              } else if (page == "transfer") {
                const fromWhs = $(`#select-0`)[0].value;
                if(fromWhs != ""){
                  tr.addClass("active-input");
                  tr.removeClass("hide");
                  tr.css("background-color", "green");
                }else{
                  tr.addClass("semi-active");
                  tr.removeClass("hide");
                  tr.css("background-color", "#ffd861");
                }
              }
            }
          });
        } else {
          const conv = $(`#conv${id}`)[0].innerHTML;
          const uom = $(`#uom-${id}`)[0].innerHTML;
          closeOrder = getCloseOrder(value,conv)
          alert(`الكمية يجب ان تكون من مضاعفات (${conv} ${uom}) اقرب كمية هي ${closeOrder}`);
          input.val("");
        }
      } else {
        if (previousVal) {
          setOrderValueZero(id);
        }
        input.val("");
      }
    } else {
      if (previousVal) {
        setOrderValueZero(id);
      }
      alert(`(${minmumOrder} - Max) الكمية يجب ان تكون بين`);
      input.val("");
    }
  }
  return;
};

const trim = (value) => {
  const str = value.toString();
  const arr = str.split(".");
  let leftStr = arr[0];
  leftStr = parseInt(leftStr);
  leftStr = leftStr.toString();
  let newStr = arr[1] ? `${leftStr}.${arr[1]}` : `${leftStr}`;
  return parseFloat(newStr);
};

const check = (value, id) => {
  const min = $(`#min-${id}`);
  const max = $(`#max-${id}`);
  const onHand = $(`#onHand-${id}`);
  const minValue = min[0].innerHTML;
  const maxValue = max[0].innerHTML;
  const onHandValue = onHand[0].innerHTML;
  let minOrder = (minValue - onHandValue) <= 0? 1 : (minValue - onHandValue)
  const conv = $(`#conv${id}`)[0].innerHTML != 0 ? $(`#conv${id}`)[0].innerHTML : minOrder;
  if (minOrder % conv != 0) {
    minOrder = minOrder + (conv - minOrder % conv)
  }
  minmumOrder = minOrder
  if ((value <= maxValue) & (value >= minOrder)) {
    return true;
  } else {
    return false;
  }
};

const checkMulti = (value, id) => {
  const conv = $(`#conv${id}`)[0].innerHTML != 0 ? $(`#conv${id}`)[0].innerHTML : value;
  if (value % conv == 0) {
    return true;
  } else {
    return false;
  }
};

const getCloseOrder = (value,conValue) => {
  const firstClose = value + (conValue - value % conValue)
  let seconClose;
  if(value > conValue){
    seconClose = value - (value % conValue)
  }else{
    seconClose = firstClose
  }
  if(seconClose < 0){
    seconClose = firstClose
  }
  return Math.abs(firstClose - value) <= Math.abs(value- seconClose)? firstClose : seconClose
}

const setOrderValueZero = async (id) => {
  $.post(`/Order/Save/${id}/0`).then((msg) => {
    if (msg == "error") {
      alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
    }
  });
};

const tryToSubmit = () => {
  $("body").attr("style", "height:100%");
  showModal("submit");
  $.post(`/Order/Submit/${page}/${note}`).then((msg) => {
    if (msg == "done") {
      note = ""
      setTimeout(() => {
        hideModal("submit");
        $("#tbody").empty();
        $("body").attr("style", "height:100%");
        setTimeout(() => {
          showModal("success");
          setTimeout(() => {
            $("#exit p")[0].innerHTML = "Log out";
            $("#report p")[0].innerHTML = "Sent report";
            hideModal("success");
          }, 1000);
        }, 500);
      }, 1000);
    } else if (msg == "error") {
      setTimeout(() => {
        changeModalCont("net-error", "submit");
      }, 1000);
    } else if (msg == "no data sent") {
      changeModalCont("noData", "submit");
      setTimeout(() => {
        hideModal("noData");
      }, 1000);
    }
  });
};

const showModal = (type) => {
  $("#demo-modal").removeClass("modal");
  $("#demo-modal").addClass("modal-v");
  switch (type) {
    case "submit":
      $(".modal_sendDataBack_container").attr("style", "display:flex;");
      break;
    case "net-error":
      $(".modal_netError_container").attr("style", "display:flex;");
      break;
    case "success":
      $(".modal_success_container").attr("style", "display:flex;");
      break;
    case "noData":
      $(".modal_noData_container").attr("style", "display:flex;");
      break;
    case "waiting":
      $(".modal_waiting_container").attr("style", "display:flex;");
      break;
    case "notes":
      $(".modal_notes_container").attr("style", "display:flex;");
      break;
    default:
      break;
  }
};

const hideModal = (type) => {
  $("#demo-modal").removeClass("modal-v");
  $("#demo-modal").addClass("modal");
  switch (type) {
    case "submit":
      $(".modal_sendDataBack_container").attr("style", "display:none;");
      break;
    case "net-error":
      $(".modal_netError_container").attr("style", "display:none;");
      break;
    case "success":
      $(".modal_success_container").attr("style", "display:none;");
      break;
    case "noData":
      $(".modal_noData_container").attr("style", "display:none;");
      break;
    case "notes":
      $(".modal_notes_container").attr("style", "display:none;");
      break;
    default:
      break;
  }
};

const changeModalCont = (newContent, oldConten) => {
  hideModal(oldConten);
  showModal(newContent);
};

const showTransaction = () => {
  $.get("/Routing").then((data) => {
    $("#body").html(data);
    $(document).ready(function () {
      document.getElementById("goTransaction").click();
    });
  });
};

const logOut = () => {
  $.post("/LogOut").then((data) => {
    $("#body").html(data);
    $(document).ready(function () {
      document.getElementById("goLogin").click();
    });
  });
};

const showReport = () => {
  setTimeout(() => {
    $.get(`/Order/Report/${page}`).then((results) => {
      if (results == "error") {
        alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
      } else {
        $("#reportDiv").html(results);
        $(document).ready(() => {
          $("#close").on("click", (e) => {
            $("#reportDiv").empty();
          });
        });
      }
    });
  }, 100);
};

const showAllReports = () => {
  $.get("/Order/AllReports").then((results) => {
    if (results == "error") {
      alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
    } else {
      $("#reportDiv").html(results);
      $(document).ready(() => {
        $("#close").on("click", (e) => {
          $("#reportDiv").empty();
        });
      });
    }
  });
};

const inputOrder = (id) => {
  $(`#input-${id}`).focus();
  const input = $(`#input-${id}`);
  const value = input.val();
  let previousVal = false;
  if (value > 0) {
    previousVal = true;
    edit(id);
  }
  $(`#input-${id}`).on("blur", () => {
    save(id, input, previousVal,value);
    input.off("blur");
    document.getElementById(`input-${id}`).removeEventListener('keydown',tabFunc)
  });
  const tabFunc = (e) => {
    if(e.key == 'Tab'){
        setTimeout(() => {
          const active = document.querySelector(":focus")
          active.click()
        },100)
    }
  }
  document.getElementById(`input-${id}`).addEventListener('keydown',tabFunc)
};

const selectFrom = (fullID) => {
  const optValue = $(fullID)[0].value
  if(optValue != option){
    option = optValue
    $.post(`/Order/From?value=${optValue}`).then((results) => {
      if (results == "error") {
        alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
      } else {
        changeStatus(optValue)
      }
    });
  }
}

const changeStatus = (value) => {
  if(value == ""){
    const rows = $('.active-input')
    if(rows.length > 0){
      for(let i = 0; i < rows.length; i++){
        const row = rows[i]
        row.classList.add("semi-active")
        row.classList.remove("active-input")
        row.style.backgroundColor = "#ffd861";
      }
    }
  }else{
    const rows = $('.semi-active')
    if(rows.length > 0){
      for(let i = 0; i < rows.length; i++){
        const row = rows[i]
        row.classList.add("active-input")
        row.classList.remove("semi-active")
        row.style.backgroundColor = "green";
      }
    }
  }
}

const createSuggest = () => {
  $.post("/Order/Create-Suggestios").then((msg) => {
    reloadPage("Undo",msg)
  })
}

const undoSuggest = () => {
  $.post("/Order/Remove-Suggestios").then((msg) => {
    reloadPage("Suggestion",msg)
  })
}

const reloadPage = (value,msg) => {
  new Promise((resolve,reject) => {
    $.post(`/Order/Label/${value}`).then(msg => {
      resolve()
    })
  }).then(() => {
    if(msg == 'error'){
      alert('بعض المواد لم يتم تعديلها لوجود خطا داخلي')
      setTimeout(() => {
        location.reload();
      },1000)
    }else{
      location.reload();
    }
  })
}