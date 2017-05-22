package server

import (
    "crypto/x509"
    "io/ioutil"
    "crypto/tls"
    "net"
    "strings"
    "project/orders/conf"
    "project/orders/webserver"
    "project/orders/controller"
    "strconv"
    "io"
    "log"
    "project/orders/structures"
)

//======================================================================================================================
//----READ_STREAM_CLIENT

func handleClient(conn net.Conn) {
    reply := make([]byte, 4)
    var lenReply int
    defer conn.Close()
    for {
        //----GET LEN MESSAGE AND MESSAGE
        reply = make([]byte, 4)
        _, err := conn.Read(reply)
        if err != nil {
            //log.Println("_, err := conn.Read(reply)")
            //log.Println(conn.RemoteAddr().String(),"-",err.Error(), string(reply))
            break
        }


        if strings.ToUpper(strings.TrimSpace(string(reply)))=="PING" {
            println("-------------- PING --------------")
            conn.Write([]byte("0004PONG"))
            continue
        }
        st := structure{conn:conn}
        lenReply,err = strconv.Atoi(string(reply))
        if err!=nil{
            st.send([]byte(""),err)
            log.Println(1)
            log.Println(conn.RemoteAddr().String(),"-",err.Error())
            continue
        }

        println("LENGTH TLS:",lenReply)
        reply = make([]byte, lenReply)
        _,err = io.ReadFull(conn,reply)
        if err!=nil{
            st.send([]byte(""),err)
            log.Println(2)
            log.Println(conn.RemoteAddr().String(),"-",err.Error())
            continue
        }

        println("GET MESSAGE TLS:",string(reply),len(string(reply)))

        err = st.SelectTables(reply[:lenReply])
        if err != nil {
            st.send([]byte(st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\": "), err)
            log.Println(st.qm.Table,"ERROR",st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\":",err.Error())
        }
    }
}

//---------------------------------------------SEND
func (st *structure)send(sendMessage []byte, err error){

    var LenMess int
    var errs error
    if len(strings.TrimSpace(string(sendMessage)))==0{
        sendMessage = append([]byte(""),[]byte("00:UNKNOWN ERROR, EMPTY MESSAGE SEND")...)
    }else {
        if err!=nil {
            sendMessage = append([]byte("00:"),sendMessage...)
            sendMessage = append(sendMessage,[]byte(err.Error())...)
        }else{
            sendMessage = append([]byte("01:"),sendMessage...)
        }
    }

    s:=strconv.Itoa(len(sendMessage))
    println(len(s))
    if len(s)<4{
        for len(s)<4{
            s = "0"+s
        }
    }
    sendMessage = append([]byte(s),sendMessage...)
    if st.conn!=nil {
        println("Message: \"",string(sendMessage),"\"")
        LenMess, errs = st.conn.Write(sendMessage)
    }else{
        log.Println("st.conn is nill")
    }
    if errs != nil {
        log.Println("00: ERROR THE MESSAGE IS NOT GONE - ",LenMess, st.conn.RemoteAddr().String(), errs)
        println("ERROR THE MESSAGE IS NOT GONE", errs.Error())
        return
    }

    println("The message is gone to "+st.conn.RemoteAddr().String())
    println("--------------------------------")
}
//----END_CLIENT--------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
func init() {
    go webserver.RegisterRoutes()
    go controller.Guard.Init()
    //-----------------------------------------
    structures.DBTypePayment = make(map[int64]string)
    structures.DBTypePayment[1]="Наличные"
    structures.DBTypePayment[2]="Банковская карта"
    structures.DBTypePayment[3]="Яндекс деньги"
    structures.DBTypePayment[4]="WebMoney"
    structures.DBTypePayment[5]="Bitcoin"
    //stream := controller.Stream{}
    //err2 := stream.ReadRows("TypePayment","RangeAll")
    //if err2==nil{
    //    var id int
    //    var name string
    //    structures.DBTypePayment = make(map[int]string)
    //    for stream.NextOrder(){
    //        err2 = stream.Rows.Scan(&id,&name)
    //        if err2==nil{
    //            structures.DBTypePayment[id] = name
    //        }
    //    }
    //}
    //if err2!=nil{
    //    println(err2.Error())
    //    log.Println("",err2)
    //}
    //
    //err2 = stream.ReadRows("Status","RangeAll")
    //if err2==nil{
    //    structures.DBStatus = make(map[int]string)
    //    var id int
    //    var name string
    //    structures.DBTypePayment = make(map[int]string)
    //    for stream.NextOrder(){
    //        err2 = stream.Rows.Scan(&id,&name)
    //        if err2==nil{
    //            structures.DBStatus[id] = name
    //        }
    //    }
    //}
    //if err2!=nil{
    //    println(err2.Error())
    //    log.Println(err2)
    //}
    //
    //err2=nil
    //---------------------------------------------




    //----------------------------------------------------------
    //----CERTS
    ca_b,   err := ioutil.ReadFile(conf.Config.TLS_pem)
    if err!=nil{
        //log.Println("SERVER ERROR READ PEM FILE",err)
        log.Println("SERVER ERROR READ PEM FILE",err)
        println("SERVER ERROR READ PEM FILE",err)
        return
    }

    ca,     err := x509.ParseCertificate(ca_b)
    if err!=nil{
        //log.Println("SERVER ERROR PARSE CERT",err)
        log.Println("SERVER ERROR PARSE CERT",err)
        println("SERVER ERROR PARSE CERT",err)
        return
    }

    //----------------------------------------------------------
    //-----REGISTER_CERT_POOL


    pool := x509.NewCertPool()
    pool.AddCert(ca)

    //----------------------------------------------------------
    //----KEY_CERT
    priv_b, err := ioutil.ReadFile(conf.Config.TLS_key)
    if err!=nil{
        //log.Println("SERVER ERROR READ KEY FILE",err)
        log.Println("SERVER ERROR READ KEY FILE",err)
        println("SERVER ERROR READ KEY FILE",err)
        return
    }

    priv,   err := x509.ParsePKCS1PrivateKey(priv_b)
    if err!=nil{
        //log.Println("SERVER ERROR PARSE PRIVATE KEY",err)
        log.Println("SERVER ERROR PARSE PRIVATE KEY",err)
        println("SERVER ERROR PARSE PRIVATE KEY",err)
        return
    }

    //----------------------------------------------------------
    //----CREATE_CERT
    cert := tls.Certificate{
        Certificate: [][]byte{ca_b},
        PrivateKey:  priv,
    }

    //----------------------------------------------------------
    //----CREATE_CONFIG
    config := tls.Config{
        ClientAuth:   tls.RequireAndVerifyClientCert,
        Certificates: []tls.Certificate{cert},
        ClientCAs:    pool,
    }

    //----------------------------------------------------------
    //----CREATE_LISTENER
    ln, err := tls.Listen("tcp", conf.Config.TLS_server+":"+conf.Config.TLS_port, &config)
    if err != nil {
        //log.Println(err)
        log.Println(err)
        return
    }
    defer ln.Close()//----CLOSE_LISTENER



    println("TLS SERVER RUNNING")

    for {
        conn, err := ln.Accept()
        if err != nil {
            log.Println(err)
            //log.Println(err)
            continue
        }

        go handleClient(conn)
    }

}
