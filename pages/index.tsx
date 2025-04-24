import {
  PublicKey,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import { DigitalAssetWithToken, JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useUmi } from "../utils/useUmi";
import { fetchCandyMachine, safeFetchCandyGuard, CandyGuard, CandyMachine, AccountVersion } from "@metaplex-foundation/mpl-candy-machine"
import styles from "../styles/Home.module.css";
import { guardChecker } from "../utils/checkAllowed";
import { Center, Card, CardHeader, CardBody, StackDivider, Heading, Stack, useToast, Text, Skeleton, useDisclosure, Button, Modal, ModalBody, ModalCloseButton, ModalContent, Image, ModalHeader, ModalOverlay, Box, Divider, VStack, Flex } from '@chakra-ui/react';
import { ButtonList } from "../components/mintButton";
import { GuardReturn } from "../utils/checkerHelper";
import { ShowNft } from "../components/showNft";
import { InitializeModal } from "../components/initializeModal";
import { headerText } from "../settings"; // deleted image import philip
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import { Link } from "@chakra-ui/react";
//import Image from "next/image";



const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const useCandyMachine = (
  umi: Umi,
  candyMachineId: string,
  checkEligibility: boolean,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>,
  firstRun: boolean,
  setfirstRun: Dispatch<SetStateAction<boolean>>
) => {
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [candyGuard, setCandyGuard] = useState<CandyGuard>();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      if (checkEligibility) {
        if (!candyMachineId) {
          console.error("No candy machine in .env!");
          if (!toast.isActive("no-cm")) {
            toast({
              id: "no-cm",
              title: "No candy machine in .env!",
              description: "Add your candy machine address to the .env file!",
              status: "error",
              duration: 999999,
              isClosable: true,
            });
          }
          return;
        }

        let candyMachine;
        try {
          candyMachine = await fetchCandyMachine(umi, publicKey(candyMachineId));
          if (candyMachine.version != AccountVersion.V2){
            toast({
              id: "wrong-account-version",
              title: "Wrong candy machine account version!",
              description: "Please use latest sugar to create your candy machine. Need Account Version 2!",
              status: "error",
              duration: 999999,
              isClosable: true,
            });
            return;
          }
        } catch (e) {
          console.error(e);
          toast({
            id: "no-cm-found",
            title: "The CM from .env is invalid",
            description: "Are you using the correct environment?",
            status: "error",
            duration: 999999,
            isClosable: true,
          });
        }
        setCandyMachine(candyMachine);
        if (!candyMachine) {
          return;
        }
        let candyGuard;
        try {
          candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
        } catch (e) {
          console.error(e);
          toast({
            id: "no-guard-found",
            title: "No Candy Guard found!",
            description: "Do you have one assigned?",
            status: "error",
            duration: 999999,
            isClosable: true,
          });
        }
        if (!candyGuard) {
          return;
        }
        setCandyGuard(candyGuard);
        if (firstRun){
          setfirstRun(false)
        }
      }
    })();
  }, [umi, checkEligibility]);

  return { candyMachine, candyGuard };
};

export default function Home() {
  const umi = useUmi();
  const solanaTime = useSolanaTime();
  const toast = useToast();
  const { isOpen: isShowNftOpen, onOpen: onShowNftOpen, onClose: onShowNftClose } = useDisclosure();
  const { isOpen: isInitializerOpen, onOpen: onInitializerOpen, onClose: onInitializerClose } = useDisclosure();
  const [mintsCreated, setMintsCreated] = useState<{ mint: PublicKey, offChainMetadata: JsonMetadata | undefined }[] | undefined>();
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [ownedTokens, setOwnedTokens] = useState<DigitalAssetWithToken[]>();
  const [guards, setGuards] = useState<GuardReturn[]>([
    { label: "startDefault", allowed: false, maxAmount: 0 },
  ]);
  const [firstRun, setFirstRun] = useState(true);
  const [checkEligibility, setCheckEligibility] = useState<boolean>(true);

  if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
    console.error("No candy machine in .env!")
    if (!toast.isActive('no-cm')) {
      toast({
        id: 'no-cm',
        title: 'No candy machine in .env!',
        description: "Add your candy machine address to the .env file!",
        status: 'error',
        duration: 999999,
        isClosable: true,
      })
    }
  }
  const candyMachineId: PublicKey = useMemo(() => {
    if (process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
      return publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
    } else {
      console.error(`NO CANDY MACHINE IN .env FILE DEFINED!`);
      toast({
        id: 'no-cm',
        title: 'No candy machine in .env!',
        description: "Add your candy machine address to the .env file!",
        status: 'error',
        duration: 999999,
        isClosable: true,
      })
      return publicKey("11111111111111111111111111111111");
    }
  }, []);
  const { candyMachine, candyGuard } = useCandyMachine(umi, candyMachineId, checkEligibility, setCheckEligibility, firstRun, setFirstRun);

  useEffect(() => {
    const checkEligibilityFunc = async () => {
      if (!candyMachine || !candyGuard || !checkEligibility || isShowNftOpen) {
        return;
      }
      setFirstRun(false);
      
      const { guardReturn, ownedTokens } = await guardChecker(
        umi, candyGuard, candyMachine, solanaTime
      );

      setOwnedTokens(ownedTokens);
      setGuards(guardReturn);
      setIsAllowed(false);

      let allowed = false;
      for (const guard of guardReturn) {
        if (guard.allowed) {
          allowed = true;
          break;
        }
      }

      setIsAllowed(allowed);
      setLoading(false);
    };

    checkEligibilityFunc();
  }, [umi, checkEligibility, firstRun]);

  const imagePath = `/assets/${Number(candyMachine?.itemsRedeemed)}.png`;

  const PageContent = () => {
    return (
      <>
        <Box
          minH="100vh"
          bgGradient="linear(to-br, orange.500, orange.300)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 4, md: 8 }}
          borderRadius="2xl"
        >
          <Card
            bg="whiteAlpha.900"
            borderRadius="2xl"
            boxShadow="2xl"
            maxW={{ base: "100%", md: "500px" }}
            w="full"
            p={{ base: 4, md: 6 }}
          >
            <CardHeader>
              <Flex alignItems="center" gap={3} flexWrap="wrap">
                <Heading size="2xl" color="red.400" fontFamily="'Comic Neue', cursive" textShadow="4px 1px 5px black" >
                  {headerText}
                </Heading>
                {loading ? (
                  <Skeleton height="40px" width="120px" ml="auto" />
                ) : (
                  <Flex justifyContent="flex-end" ml="auto">
                    <Box
                      bg="yellow.300"
                      borderRadius="md"
                      minW="100px"
                      p={2}
                      textAlign="center"
                    >
                      <VStack spacing={0}>
                        <Text fontSize="sm" color="purple.600">
                          Available NFTs
                        </Text>
                        <Text fontWeight="bold" color="purple.800">
                          {Number(candyMachine?.data.itemsAvailable) - Number(candyMachine?.itemsRedeemed)}/{Number(candyMachine?.data.itemsAvailable)}
                        </Text>
                      </VStack>
                    </Box>
                  </Flex>
                )}
              </Flex>
            </CardHeader>

            <CardBody>
              <Center>
                <Box rounded="lg" mt={-8} pos="relative">
                  <Image
                    rounded="lg"
                    height={{ base: 180, md: 230 }}
                    width={{ base: 180, md: 230 }}
                    objectFit="cover"
                    alt="FARTCAT Image preview"
                    src={imagePath} 
                    border="4px solid"
                    borderColor="red.300"
                    shadow="5px 5px 1px 1px rgba(7, 7, 7, 0.2)"
                  />
                </Box>
              </Center>
              <Stack divider={<StackDivider />} spacing={6} mt={6}>
                {loading ? (
                  <Box>
                    <Divider my="10px" />
                    <Skeleton height="30px" my="10px" />
                    <Skeleton height="30px" my="10px" />
                    <Skeleton height="30px" my="10px" />
                  </Box>
                ) : (
                  <ButtonList
                    guardList={guards}
                    candyMachine={candyMachine}
                    candyGuard={candyGuard}
                    umi={umi}
                    ownedTokens={ownedTokens}
                    setGuardList={setGuards}
                    mintsCreated={mintsCreated}
                    setMintsCreated={setMintsCreated}
                    onOpen={onShowNftOpen}
                    setCheckEligibility={setCheckEligibility}
                  />
                )}
              </Stack>
            </CardBody>
          </Card>
          {umi.identity.publicKey === candyMachine?.authority ? (
            <>
              <Center mt={6}>
                <Button
                  bg="red.400"
                  color="white"
                  _hover={{ bg: "red.500" }}
                  _active={{ bg: "red.600" }}
                  size="lg"
                  onClick={onInitializerOpen}
                >
                  Initialize Everything!
                </Button>
              </Center>
              <Modal isOpen={isInitializerOpen} onClose={onInitializerClose}>
                <ModalOverlay />
                <ModalContent maxW="600px">
                  <ModalHeader>Initializer</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <InitializeModal umi={umi} candyMachine={candyMachine} candyGuard={candyGuard} />
                  </ModalBody>
                </ModalContent>
              </Modal>
            </>
          ) : (<></>)}

          <Modal isOpen={isShowNftOpen} onClose={onShowNftClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Your minted NFT:</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <ShowNft nfts={mintsCreated} />
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
      </>
    );
  };

  return (
    <main>
      <Box className={styles.wallet} mb={6}>
        <WalletMultiButtonDynamic />
      </Box>
      <Box className={styles.center}>
        <PageContent key="content" />
      </Box>
    </main>
  );
}