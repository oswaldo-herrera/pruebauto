export const getCookie = (name) => {
    let cookieValue = "";
    if (document.cookie && document.cookie !== '') {
      let cookies = document.cookie.split(';');
      cookies.map((value) => {
        value = value.replace(/\s/g, '');
        let toDecode = value.split("=");
        if (toDecode[0] === name && toDecode[1])
          cookieValue = decodeURIComponent(toDecode[1]);
      });
    }
    return cookieValue;
  }