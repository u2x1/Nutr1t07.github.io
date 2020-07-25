var real_origin = "";
function decrypt() {
  var passwd = document.getElementById("passwd").value;
  if (real_origin == "") {
    real_origin = document.getElementById("article-content").innerText;
  }
  var newStr = "";
  for (i = 0; i < real_origin.length; i++) {
    newStr = newStr + String.fromCharCode(real_origin.charCodeAt(i) - passwd.charCodeAt(i % passwd.length));
  }
  document.getElementById("article-content").innerHTML = newStr;
}

function reset() {
  if (real_origin != "") {
    document.getElementById("article-content").innerHTML = real_origin;
  }
}

function hidePasswdDiv() {
  var par = document.getElementById("article");
  par.removeChild(document.getElementById("passwd-div"));
}
