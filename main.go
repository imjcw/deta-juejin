package main

import (
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/deta/deta-go/deta"
	"github.com/deta/deta-go/service/base"
)

var DB *base.Base

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		log.Fatal(err)
		return
	}
	time.Local = loc

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Hello world!")
	})
	http.HandleFunc("/__space/v0/actions", func(w http.ResponseWriter, r *http.Request) {
		initDB()
		if hasDone() {
			log.Fatal("hasDone")
			return
		}
		if !canAct() {
			log.Fatal("cannot act")
			return
		}
		act()
		actAfter()
		log.Fatal("act success")
	})
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

// genActTime 生成执行时间
func genActTime() int64 {
	source := rand.NewSource(time.Now().UnixNano())
	rng := rand.New(source)

	currentDate := time.Now().Format("2006-01-02")
	startTime, _ := time.Parse("2006-01-02 15:04", currentDate+" 07:30")
	endTime, _ := time.Parse("2006-01-02 15:04", currentDate+" 18:00")

	randomTime := startTime.Add(time.Duration(rng.Int63n(int64(endTime.Sub(startTime)))))

	return randomTime.Unix()
}

// getActTime 获取执行时间
func getActTime() int64 {
	actItem := map[string]interface{}{}
	err := DB.Get("actTime", &actItem)
	if err != nil && deta.ErrNotFound != err {
		log.Fatal("Error:", err)
		panic(err)
	}
	var actTime int64
	if deta.ErrNotFound != err {
		actTime = int64(actItem["value"].(float64))
	}
	// 获取当前日期
	currentTime := time.Now()
	// 获取今天的日期
	today := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, currentTime.Location())
	if actTime < today.Unix() {
		actTime = genActTime()
		item := map[string]interface{}{
			"key":   "actTime",
			"value": actTime,
		}
		_, err := DB.Put(item)
		if err != nil {
			log.Fatal("Error:", err)
			panic(err)
		}
	}
	return actTime
}

// hasDone 是否已经执行
func hasDone() bool {
	signItem := map[string]interface{}{}
	err := DB.Get("signTime", &signItem)
	if err != nil && deta.ErrNotFound != err {
		log.Fatal("Error:", err)
		panic(err)
	}
	var signTime int64
	if deta.ErrNotFound != err {
		signTime = int64(signItem["value"].(float64))
	}
	// 获取当前日期
	currentTime := time.Now()
	// 获取今天的日期
	today := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, currentTime.Location())
	return signTime > today.Unix()
}

func canAct() bool {
	return time.Now().Unix() > getActTime()
}

func act() {
	response, err := http.Get(os.Getenv("SIGN_URL"))
	if err != nil {
		log.Fatal("Error:", err)
		panic(err)
	}
	defer response.Body.Close()

	if _, err := io.ReadAll(response.Body); err != nil {
		log.Fatal("Error:", err)
		panic(err)
	}
	// log.Fatal(string(bodyBytes))
}

func actAfter() {
	doneItem := map[string]interface{}{
		"key":   "signTime",
		"value": time.Now().Unix(),
	}
	DB.Put(doneItem)
	log.Fatal("act after")
}

func initDB() {
	d, err := deta.New()
	if err != nil {
		log.Fatal("Error:", err)
		panic(err)
	}

	db, err := base.New(d, "base_name")
	if err != nil {
		log.Fatal("Error:", err)
		panic(err)
	}
	DB = db
}
