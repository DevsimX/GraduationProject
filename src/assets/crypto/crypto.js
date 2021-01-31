export var Crypto = function() {

};

Crypto.prototype.encode = function(object) {
  let str = JSON.stringify(object);
  const arr = [];
  let i = 0, len = str.length;
  for(; i<len; i++){
    let charCode = str.charCodeAt(i);
    if( charCode >= 65 && charCode <= 90) {
      arr.push(String.fromCharCode((charCode + 13 - 65) % 26 + 65));
    } else if(charCode >= 97 && charCode <= 122) {
      arr.push(String.fromCharCode((charCode + 13 - 97) % 26 + 97));
    } else {
      arr.push(String.fromCharCode(charCode));
    }

  }
  return encodeURI(arr.join(""));
};

Crypto.prototype.decode = function(str) {
  str = decodeURI(str);
  const arr = [];
  let i = 0, len = str.length;
  for(; i<len; i++){
    let charCode = str.charCodeAt(i);
    if( charCode >= 65 && charCode <= 90) {
      arr.push(String.fromCharCode((charCode - 13 - 65 + 26) % 26 + 65));
    } else if(charCode >= 97 && charCode <= 122) {
      arr.push(String.fromCharCode((charCode + 13 - 97 + 26) % 26 + 97));
    } else {
      arr.push(String.fromCharCode(charCode));
    }
  }
  return JSON.parse(arr.join(""));
};




