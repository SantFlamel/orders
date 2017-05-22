package main

import (
    "log"
    "io/ioutil"
    "crypto/x509"
    "project/orders/conf"
    "crypto/tls"
    "net"
    "errors"
    "github.com/fatih/color"
    "strconv"
)
var reply []byte
var ID int64
var IDitem int64

func main() {
    var err error
    //ID = 0
    //------------------------------------------------------------------------------------------------------------------
    //========ORDER
    //----PING----
    //order(0)
    //for i:=0;i<10;i++{

    /*----INSERT----*/
    //----INSERT_GET_ID----
    //err = order(1)
    //if err != nil {
    //    println(err)
    //    return
    //}
    ////----INSERT----
    //order(2)
    //
    ///*----UPDATE----*/
    //println("-------------------------------------------------------------------")
    ////----UPDATE_TimeDeliveredBy----
    //order(3)
    ////if err!=nil{println(err);return }
    ////----UPDATE_REDONE----
    //order(4)
    ////if err!=nil{println(err);return }
    ////----UPDATE_PRICE----
    //order(5)
    ////if err!=nil{println(err);return }
    ////----UPDATE_PRICE----
    //order(5)
    ////if err!=nil{println(err);return }
    ////----UPDATE_DISCOUNT----
    ////err = order(6,conn)
    ////----UPDATE_STATUS----
    //order(7)
    //
    ///*----READ----*/
    //println("-------------------------------------------------------------------")
    ////----READ
    //order(50)
    ////if err!=nil{println(err);return }
    //
    ////----READ_STATUS
    //order(51)
    ////if err!=nil{println(err);return }
    //
    ////----READ_COUNT_ALL
    //order(52)
    ////if err!=nil{println(err);return }
    //
    ////----READ_RANGE
    //println("-------------")
    //order(60)
    //
    //
    //
    //
    //////////////////////////////////////////////////////////////////////////////////////
    //println("//////////////////////////////////////////////////////////////////////////////////")
    //println("//----CREATE_ORDER_CUSTOMER")
    //order_customer(1)
    //println("//----UPDATE_ORDER_CUSTOMER")
    //order_customer(2)
    //println("//----READ_ORDER_CUSTOMER")
    //order_customer(3)
    //
    //////////////////////////////////////////////////////////////////////////////////////
    //println("//////////////////////////////////////////////////////////////////////////////////")
    //println("//----CREATE_ORDER_LIST")
    //err = orderList(1)
    //println(err)
    //println("//----UPDATE_ORDER_LIST_FINISHED")
    //orderList(2)
    //println("//----READ_ORDER_LIST_VALUE")
    //orderList(30)
    //println("//----READ_ORDER_LIST_RANGE")
    //orderList(40)
    //
    ////////////////////////////////////////////////////////////////////////////////////
    //println("//////////////////////////////////////////////////////////////////////////////////")
    //println("//----CREATE_ORDER_PERSONAL")
    //order_personal(1)
    //println("//----READ_ORDER_PERSONAL_VALUE")
    //order_personal(2)
    //println("//----READ_RANGE_ROLE")
    //order_personal(3)
    //println("//----READ_RANGE_ORDER_ID")
    //order_personal(4)
    //
    ////////////////////////////////////////////////////////////////////////////////////
    //println("//////////////////////////////////////////////////////////////////////////////////")
    //println("//----CREATE_ORDER_PAYMENTS")
    //order_payments(1)
    //println("//----UPDATE_ORDER_PAYMENTS")
    //order_payments(2)
    //println("//----READ_ORDER_PAYMENTS_VALUE")
    //order_payments(3)
    //println("//----READ_ORDER_PAYMENTS_RANGE_ALL")
    //order_payments(4)
    //println("//----READ_ORDER_PAYMENTS_RANGE_ORDER_ID")
    //order_payments(5)
    //
    ////////////////////////////////////////////////////////////////////////////////////
    //println("//////////////////////////////////////////////////////////////////////////////////")
    //println("//----CREATE_ORDER_STATUS")
    //order_status(1)
    //println("//----READ_ORDER_STATUS")
    //order_status(2)
    //println("//----READ_ORDER_STATUS_RANGE")
    //order_status(3)
    //
    ///*----DELETE----*/
    //println("-------------------------------------------------------------------")
    //----DELETE_ITEM----
    //err = order(100)
    //if err!=nil{println(err);return }


    //st := "{\"Table\":\"Session\",\"Query\":\"Read\",\"TypeParameter\":\"Hash\",\"Values\":[\"94cf8307be3a50abe776132ca0ab18b53c6de12a47cafdbcd3970aa5877a8cde\"]}"
    st := ""
    println(len(st))
    s:=strconv.Itoa(len(st))
    println(len(s))
    if len(s)<4{
        for len(s)<4{
            s = "0"+s
        }
    }

    _ ,err = send(s+st)
    //_ ,err = send("{\"Table\":\"Session\",\"Query\":\"Read\",\"TypeParameter\":\"Hash\",\"Values\":[\"94cf8307be3a50abe776132ca0ab18b53c6de12a47cafdbcd3970aa5877a8cde\"]}")
    if err!=nil{println(err);return }
}

//----------------------------------------------------------------------------------------------------------------------

func send(message string)(string,error){
    conn := Conn()
    reply = make([]byte, 16384)
    println("----------------------------------")
    println(message)
    println("----------------------------------")

    n, err := conn.Write([]byte(message))
    if err != nil {
        log.Println(n, err)
        println("Message is not gone")
        return "",err
    }
    println("Message is gone, my address: "+conn.LocalAddr().String())
    n, err = conn.Read(reply)
    if err != nil {
        log.Println(err)
        return "",errors.New("ERROR_NOT_RECEIVED_A_MESSAGE")
    }

    //----ERROR_CHECKING
    //if string(reply[:6]) == "ERROR:" {errorServer(reply[:n])}

    println("LEN_MESSAGE:",len(reply[:n]))

    if len(reply[:n])>2&&string(reply[:n])[:2]=="00" {
        color.Red(string(reply[:n]))
        return string(reply[:n]),errors.New(string(reply[:n]))
    }else{
        color.Green(string(reply[:n]))
    }
    return string(reply[:n]),nil
}
func sendReadRange(message string){
    conn := Conn()
    reply = make([]byte, 16384)

    n, err := conn.Write([]byte(message))
    if err != nil {
        log.Println(n, err)
        println("Message is not gone")
        println(err.Error())
    }
    println("Message is gone, my address: "+conn.LocalAddr().String())
    for {
        n, err = conn.Read(reply)
        if err != nil {
            log.Println(err)
            println(err.Error())
        }

        //----ERROR_CHECKING
        //if string(reply[:6]) == "ERROR:" {errorServer(reply[:n])}

        println("LEN_MESSAGE:", len(reply[:n]))

        if len(reply[:n]) > 2 && string(reply[:n])[:2] == "00" {
            color.Red(string(reply[:n]))
            println(err.Error())
        } else {
            color.Green(string(reply[:n]))
        }
        if string(reply[:n])[3:]=="EOF"{break}
        println("--------------------------------------")
    }
    println("----------------------------------------------")
}

func Conn() net.Conn{
    //----READ_PEM_FILE_CERTIFICATES
    cert_b, err := ioutil.ReadFile(conf.Config.TLS_pem)
    if err!=nil{println(recover(), err.Error());println(1);return nil}

    //----READ_KEY_FILE_CERTIFICATES
    key_b, err := ioutil.ReadFile(conf.Config.TLS_key)
    if err!=nil{println(recover(), err.Error());println(2);return nil}

    //----RETURN_PRIVATE_KEY_RSA
    priv, err := x509.ParsePKCS1PrivateKey(key_b)
    if err!=nil{println(recover(), err.Error());println(3);return nil}

    //----CHAIN_OF_CERTIFICATES
    cert := tls.Certificate{
        //----PEM_FILE
        Certificate: [][]byte{cert_b},
        //----KEY_FILE
        PrivateKey:  priv,
    }

    //----TLS_CONNECTION_CONFIGURATION
    config := tls.Config{
        Certificates: []tls.Certificate{cert},
        InsecureSkipVerify: true}

    //----GET_STRING_LISTEN_PORT
    service := conf.Config.TLS_server + ":" + conf.Config.TLS_port
    //service := "192.168.0.132:441"
    //----CREATE_CONNECTION
    conn, err := tls.Dial("tcp", service, &config)
    if err != nil {
        println("client: dial: %s",err.Error())
        log.Fatalf("client: dial: %s", err)
    }
    //----REMOTE_ADDRESS
    log.Println("client: connected to: ", conn.RemoteAddr())

    state := conn.ConnectionState()
    log.Println("client: handshake: ", state.HandshakeComplete)
    log.Println("client: mutual: ", state.NegotiatedProtocolIsMutual)
    return conn
}