package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"strings"
)

const (
	PCM_ACTION_HELLO  = 1
	PCM_ACTION_CREATE = 2
	PCM_ACTION_UPDATE = 3
	PCM_ACTION_DELETE = 4
)

type PostChangeMessage struct {
	Action int             `json:"action"`
	UUID   string          `json:"uuid"`
	Info   *PostChangeInfo `json:"info"`
}

type PostChangeInfo struct {
	UUID     string   `json:"uuid"`
	AuthorID int      `json:"author_id"`
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Images   []string `json:"images"`
	Price    float64  `json:"price"`
	Currency int      `json:"currency"`
	Country  int      `json:"country"`
	Location struct {
		Latitude  float64 `json:"lat"`
		Longitude float64 `json:"lon"`
	} `json:"location"`
	CreatedAt    int `json:"created_at"`
	UpdatedAt    int `json:"updated_at"`
	CommentCount int `json:"comment_count"`
}

const (
	SM_SYNC         = 1
	SM_CAPTAIN_ACK  = 2
	SM_CONSUMER_ACK = 3
)

type SyncMessage struct {
	Meaning   int      `json:"meaning"`
	Captains  []string `json:"captains"`
	Consumers []string `json:"consumers"`
}

type Comm struct {
	conn *net.UDPConn
}

func NewComm() Comm {
	// open socket
	env := os.Getenv("P2P_LISTEN_ADDR")
	if env == "" {
		panic("P2P_LISTEN_ADDR is not set")
	}

	addr := parseAddr(env)

	conn, err := net.ListenUDP("udp", &addr)
	panicOnError(err, "Failed to listen on UDP")

	// notify a captain of our existence
	env = os.Getenv("BOOTSTRAP_P2P_CAPTAIN")
	if env == "" {
		panic("BOOTSTRAP_P2P_CAPTAIN is not set")
	}

	addr = parseAddr(env)

	bytes, _ := json.Marshal(makeAckMessage())
	conn.WriteToUDP(bytes, &addr)

	return Comm{conn}
}

func (comm Comm) Listen(elastic Elastic) {
	for {
		var err error
		buf := make([]byte, 4096) // TODO: is this big enough?
		n, addr, err := comm.conn.ReadFromUDP(buf)
		if err != nil {
			log.Println("Failed to read from UDP", err)
			continue
		}

		data := buf[:n]
		msg := PostChangeMessage{}
		err = json.Unmarshal(data, &msg)
		if err != nil {
			log.Println("Failed to unmarshal to PostChangeMessage", err)
			continue
		}

		switch msg.Action {
		case PCM_ACTION_HELLO:
			log.Println("Hello!")
		case PCM_ACTION_CREATE:
			err = elastic.ingestPostChange(msg)
		case PCM_ACTION_UPDATE:
			err = elastic.ingestPostChange(msg)
		case PCM_ACTION_DELETE:
			err = elastic.removePost(msg.UUID)
		default:
			log.Println("Unknown action", msg.Action)
			continue
		}

		if err != nil {
			log.Println("Udp handler error: ", err)
			continue
		}

		bytes, _ := json.Marshal(makeAckMessage())
		comm.conn.WriteToUDP(bytes, addr)
	}
}

func (comm Comm) Close() {
	comm.conn.Close()
}

func makeAckMessage() SyncMessage {
	return SyncMessage{
		Meaning:   SM_CONSUMER_ACK,
		Captains:  []string{},
		Consumers: []string{},
	}
}

func parseAddr(start string) net.UDPAddr {
	parts := strings.Split(start, ":")
	if len(parts) != 2 {
		panic(fmt.Sprintf("Address is invalid: %v", start))
	}

	port, err := strconv.Atoi(parts[1])
	panicOnError(err, fmt.Sprintf("Failed to parse port, from %v", parts[1]))

	ip, err := net.ResolveIPAddr("ip", parts[0])
	panicOnError(err, fmt.Sprintf("Failed to resolve ip, from %v", parts[0]))
	if ip == nil {
		panic(fmt.Sprintf("Failed to parse ip, from %v", parts[0]))
	}

	return net.UDPAddr{
		Port: port,
		IP:   ip.IP,
	}
}
