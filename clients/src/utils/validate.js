export class Validate {
    static email(mail) {
      if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return true;
      }
      return false;
    }
  
    static Password = (val) => {
      return val.length >= 6;
    };
  }